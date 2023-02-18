import nodeVibrant from 'node-vibrant';
import log from '../log';

const generatePalette = async (
  artwork: Buffer | string,
  sendAdditionalData = true
) => {
  if (artwork) {
    const palette = await nodeVibrant
      .from(artwork)
      .getPalette()
      .catch((err) => {
        return log(
          `ERROR OCCURRED WHEN PARSING A SONG ARTWORK TO GET A COLOR PALETTE.`,
          { err },
          'ERROR'
        );
      });

    if (palette) {
      const generatePaletteSwatch = <T extends typeof palette.DarkMuted>(
        nodeVibrantSwatch: T
      ): NodeVibrantPaletteSwatch | undefined => {
        if (nodeVibrantSwatch) {
          const additionalData = {
            population: nodeVibrantSwatch.population,
            hex: nodeVibrantSwatch.hex,
            hsl: nodeVibrantSwatch.hsl,
            bodyTextColor:
              nodeVibrantSwatch.bodyTextColor ||
              nodeVibrantSwatch.getBodyTextColor(),
            titleTextColor:
              nodeVibrantSwatch.titleTextColor ||
              nodeVibrantSwatch.getTitleTextColor(),
          };

          const data = {
            rgb: nodeVibrantSwatch.rgb,
          };

          if (sendAdditionalData) Object.assign(data, additionalData);

          return data;
        }
        return undefined;
      };

      const outputPalette: NodeVibrantPalette = {
        Vibrant: generatePaletteSwatch(palette.Vibrant),
        LightVibrant: generatePaletteSwatch(palette.LightVibrant),
        DarkVibrant: generatePaletteSwatch(palette.DarkVibrant),
        Muted: generatePaletteSwatch(palette.Muted),
        LightMuted: generatePaletteSwatch(palette.LightMuted),
        DarkMuted: generatePaletteSwatch(palette.DarkMuted),
      };
      return outputPalette;
    }
    log('GENERATED ARTWORK PALETTE EMPTY.', undefined, 'ERROR');
    return undefined;
  }
  log('EMPTY INPUT TO GENERATE A PALETTE.', undefined, 'WARN');
  return undefined;
};

export default generatePalette;
