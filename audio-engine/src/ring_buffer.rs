use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::Arc;

/// A lock-free Single-Producer Single-Consumer (SPSC) ring buffer for audio streaming.
pub struct SpscRingBuffer {
    buffer: Box<[UnsafeCell<f32>]>,
    capacity: usize,
    mask: usize,
    write_idx: AtomicUsize,
    read_idx: AtomicUsize,
    eof: AtomicBool,
}

// Safety: SpscRingBuffer guarantees that the producer only writes to memory
// not currently being read by the consumer, and memory ordering (Acquire/Release)
// ensures synchronization between write_idx and read_idx.
unsafe impl Send for SpscRingBuffer {}
unsafe impl Sync for SpscRingBuffer {}

impl SpscRingBuffer {
    /// Create a new SPSC ring buffer. The capacity is rounded up to the next power of two.
    pub fn new(min_capacity: usize) -> Arc<Self> {
        let capacity = min_capacity.next_power_of_two().max(1024);
        let mask = capacity - 1;
        let mut v = Vec::with_capacity(capacity);
        for _ in 0..capacity {
            v.push(UnsafeCell::new(0.0f32));
        }

        Arc::new(Self {
            buffer: v.into_boxed_slice(),
            capacity,
            mask,
            write_idx: AtomicUsize::new(0),
            read_idx: AtomicUsize::new(0),
            eof: AtomicBool::new(false),
        })
    }

    /// Number of samples currently available to read.
    #[inline]
    pub fn available_read(&self) -> usize {
        let w = self.write_idx.load(Ordering::Acquire);
        let r = self.read_idx.load(Ordering::Relaxed);
        w.wrapping_sub(r)
    }

    /// Number of free sample slots available to write.
    #[inline]
    pub fn available_write(&self) -> usize {
        let r = self.read_idx.load(Ordering::Acquire);
        let w = self.write_idx.load(Ordering::Relaxed);
        let occupied = w.wrapping_sub(r);
        if occupied >= self.capacity {
            0
        } else {
            self.capacity - occupied
        }
    }

    /// Total capacity in samples.
    #[inline]
    pub fn capacity(&self) -> usize {
        self.capacity
    }

    /// Push up to `data.len()` samples into the ring buffer.
    /// Returns the number of samples successfully written.
    pub fn push_slice(&self, data: &[f32]) -> usize {
        let to_write = data.len().min(self.available_write());
        if to_write == 0 {
            return 0;
        }

        let w = self.write_idx.load(Ordering::Relaxed);
        for i in 0..to_write {
            let slot = (w.wrapping_add(i)) & self.mask;
            // Safety: available_write() guarantees this slot is not currently read.
            unsafe {
                *self.buffer[slot].get() = data[i];
            }
        }

        self.write_idx
            .store(w.wrapping_add(to_write), Ordering::Release);
        to_write
    }

    /// Pop up to `data.len()` samples from the ring buffer.
    /// Returns the number of samples successfully read.
    pub fn pop_slice(&self, data: &mut [f32]) -> usize {
        let to_read = data.len().min(self.available_read());
        if to_read == 0 {
            return 0;
        }

        let r = self.read_idx.load(Ordering::Relaxed);
        for i in 0..to_read {
            let slot = (r.wrapping_add(i)) & self.mask;
            // Safety: available_read() guarantees this slot was written and is not currently overwritten.
            unsafe {
                data[i] = *self.buffer[slot].get();
            }
        }

        self.read_idx
            .store(r.wrapping_add(to_read), Ordering::Release);
        to_read
    }

    /// Clear all pending samples from the buffer and reset EOF flag.
    pub fn clear(&self) {
        let w = self.write_idx.load(Ordering::Acquire);
        self.read_idx.store(w, Ordering::Release);
        self.eof.store(false, Ordering::Release);
    }

    /// Signal end-of-file from the producer.
    pub fn set_eof(&self, eof: bool) {
        self.eof.store(eof, Ordering::Release);
    }

    /// Check if EOF was signaled by the producer.
    pub fn is_eof(&self) -> bool {
        self.eof.load(Ordering::Acquire)
    }

    /// Check if the buffer has reached EOF and has been completely drained by consumer.
    pub fn is_eof_and_empty(&self) -> bool {
        self.is_eof() && self.available_read() == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_ring_buffer_basic_push_pop() {
        let rb = SpscRingBuffer::new(1024);
        let input = vec![1.0f32, 2.0, 3.0, 4.0, 5.0];
        let written = rb.push_slice(&input);
        assert_eq!(written, 5);
        assert_eq!(rb.available_read(), 5);

        let mut output = vec![0.0f32; 5];
        let read = rb.pop_slice(&mut output);
        assert_eq!(read, 5);
        assert_eq!(output, input);
        assert_eq!(rb.available_read(), 0);
    }

    #[test]
    fn test_ring_buffer_wraparound() {
        let rb = SpscRingBuffer::new(1024);
        let cap = rb.capacity();

        let chunk = vec![0.5f32; 800];
        assert_eq!(rb.push_slice(&chunk), 800);
        let mut out = vec![0.0f32; 800];
        assert_eq!(rb.pop_slice(&mut out), 800);

        // Now write another 800 samples which wraps around the internal ring
        assert_eq!(rb.push_slice(&chunk), 800);
        assert_eq!(rb.pop_slice(&mut out), 800);
        assert_eq!(out, chunk);
        assert_eq!(rb.available_read(), 0);
        assert_eq!(rb.available_write(), cap);
    }

    #[test]
    fn test_ring_buffer_spsc_thread_streaming() {
        let rb = SpscRingBuffer::new(4096);
        let rb_consumer = rb.clone();

        let total_samples = 50_000usize;

        let producer = thread::spawn(move || {
            let mut val = 1.0f32;
            let mut sent = 0;
            while sent < total_samples {
                let to_send = 128.min(total_samples - sent);
                let chunk: Vec<f32> = (0..to_send).map(|_| {
                    let v = val;
                    val += 1.0;
                    v
                }).collect();

                let mut offset = 0;
                while offset < chunk.len() {
                    let n = rb.push_slice(&chunk[offset..]);
                    offset += n;
                    if n == 0 {
                        thread::yield_now();
                    }
                }
                sent += to_send;
            }
            rb.set_eof(true);
        });

        let consumer = thread::spawn(move || {
            let mut received = Vec::with_capacity(total_samples);
            let mut buf = [0.0f32; 256];
            while !rb_consumer.is_eof_and_empty() {
                let n = rb_consumer.pop_slice(&mut buf);
                if n > 0 {
                    received.extend_from_slice(&buf[..n]);
                } else {
                    thread::yield_now();
                }
            }
            received
        });

        producer.join().unwrap();
        let received = consumer.join().unwrap();
        assert_eq!(received.len(), total_samples);
        for (i, &v) in received.iter().enumerate() {
            assert_eq!(v, (i + 1) as f32);
        }
    }
}
