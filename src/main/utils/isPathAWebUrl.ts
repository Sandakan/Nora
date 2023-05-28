const webUrlRegex = /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w\- ;,./?%&=]*))/gm;

const isPathAWebURL = (artworkPath: string) => {
  const bool = webUrlRegex.test(artworkPath);
  webUrlRegex.lastIndex = 0;
  return bool;
};

export default isPathAWebURL;
