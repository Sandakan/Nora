type Props = { palette: PaletteData };

const manageBrightness = (
  values: [number, number, number],
  min = 0.9
  // max = 1
): [number, number, number] => {
  const [h, s, l] = values;

  const updatedL = l >= min ? l : min;
  return [h, s, updatedL];
};

const generateColor = (values: [number, number, number]) => {
  const [lh, ls, ll] = values;
  const color = `${lh * 360} ${ls * 100}% ${ll * 100}%`;
  return color;
};

const DynamicThemeSettings = (props: Props) => {
  const { palette } = props;

  const highLightVibrant = generateColor(manageBrightness(palette.LightVibrant?.hsl || [0, 0, 0]));
  const mediumLightVibrant = generateColor(
    manageBrightness(palette.LightVibrant?.hsl || [0, 0, 0], 0.75)
  );
  const highVibrant = generateColor(manageBrightness(palette.Vibrant?.hsl || [0, 0, 0], 0.7));

  return (
    <div className="mt-4 flex gap-4">
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: palette?.DarkVibrant?.hex }}
        />
        <span>Dark Vibrant</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: palette?.LightVibrant?.hex }}
        />
        <span>Light Vibrant</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: palette?.DarkMuted?.hex }}
        />
        <span>Dark Muted</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: palette?.LightMuted?.hex }}
        />
        <span>Light Muted</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span className="h-12 w-20 rounded-md" style={{ backgroundColor: palette?.Vibrant?.hex }} />
        <span>Vibrant</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span className="h-12 w-20 rounded-md" style={{ backgroundColor: palette?.Muted?.hex }} />
        <span>Muted</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: `hsl(${highLightVibrant})` }}
        />
        <span>highLightVibrant</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span
          className="h-12 w-20 rounded-md"
          style={{ backgroundColor: `hsl(${mediumLightVibrant})` }}
        />
        <span>mediumLightVibrant</span>
      </span>
      <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
        <span className="h-12 w-20 rounded-md" style={{ backgroundColor: `hsl(${highVibrant})` }} />
        <span>highVibrant</span>
      </span>
    </div>
  );
};

export default DynamicThemeSettings;
