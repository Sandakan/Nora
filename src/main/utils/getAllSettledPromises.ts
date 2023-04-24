export default async <Prom extends Promise<unknown>>(promises: Prom[]) => {
  const fulfilled = [];
  const rejected = [];

  const awaitedPromises = await Promise.allSettled(promises);

  for (const prom of awaitedPromises) {
    if (prom.status === 'fulfilled') fulfilled.push(prom.value);
    else rejected.push(prom.reason);
  }

  return { fulfilled, rejected };
};
