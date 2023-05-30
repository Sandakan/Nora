import parseLyrics from '../src/main/utils/parseLyrics';

const lyrics = `
[00:14.096] <00:14.665> We're  not <00:15.209> in <00:15.402> love 
[00:16.918] <00:17.327> We share <00:17.708> no <00:18.030> stories  
[00:19.709] <00:20.095> Just something <00:21.444> in your <00:21.907> eyes 
[00:25.353] <00:25.773> Don't be <00:26.136> afraid <00:28.199> The <00:28.673> shadows <00:29.288> know <00:29.990> me
[00:31.030] <00:31.364> Let's leave <00:31.761> the <00:32.116> world <00:32.764> behind 

[00:36.446] <00:37.083> Take me <00:37.696> through <00:38.106> the <00:38.331> night
[00:38.828] <00:39.213> Fall into <00:40.566> the <00:41.002> dark <00:41.309> side 
[00:42.706] <00:43.208> We don't <00:43.484> need <00:43.686> the <00:43.974> light
[00:44.480] <00:44.821> We'll live <00:45.485> on <00:46.059> the <00:46.277> dark <00:46.836> side 
[00:47.901] <00:48.271> I see <00:48.719> it, <00:49.385> let's <00:49.752> feel <00:50.095> it 
[00:50.809] <00:52.033> While we're <00:52.631> still <00:52.879> young <00:53.077> and <00:53.250> fearless 
[00:53.554] <00:54.035> Let go <00:54.524> of <00:54.778> the <00:55.106> light 
[00:55.757] <00:56.134> Fall into <00:57.372> the <00:57.660> dark <00:58.185> side 
[01:01.973] <01:02.380>  Fall into <01:03.028> the <01:03.281> dark <01:03.808> side 
[01:07.079] <01:07.401> Give into <01:08.611> the <01:08.888> dark <01:09.506> side 
[01:15.877] <01:16.555> Let go <01:17.195> of <01:17.448> the <01:17.721> light 
[01:18.313] <01:18.741> Fall into <01:19.927> the <01:20.287> dark <01:20.843> side`;

test('lyrics test', () => {
  const val = parseLyrics(lyrics);
  expect(val).toBeInstanceOf(Object);
});
