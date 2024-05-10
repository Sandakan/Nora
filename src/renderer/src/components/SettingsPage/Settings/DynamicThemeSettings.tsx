type Props = { palette: PaletteData };

const manageBrightness = (
  values: [number, number, number],
  range?: { min?: number; max?: number }
): [number, number, number] => {
  const max = range?.max || 1;
  const min = range?.min || 0.9;

  const [h, s, l] = values;

  const updatedL = l >= min ? (l <= max ? l : max) : min;
  return [h, s, updatedL];
};

const manageSaturation = (
  values: [number, number, number],
  range?: { min?: number; max?: number }
): [number, number, number] => {
  const max = range?.max || 1;
  const min = range?.min || 0.9;

  const [h, s, l] = values;

  const updatedS = s >= min ? (s <= max ? s : max) : min;
  return [h, updatedS, l];
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
    manageBrightness(palette.LightVibrant?.hsl || [0, 0, 0], { min: 0.75 })
  );
  const darkLightVibrant = generateColor(
    manageSaturation(
      manageBrightness(palette.LightVibrant?.hsl || [0, 0, 0], {
        max: 0.2,
        min: 0.2
      }),
      { max: 0.05, min: 0.05 }
    )
  );
  const highVibrant = generateColor(
    manageBrightness(palette.Vibrant?.hsl || [0, 0, 0], { min: 0.7 })
  );

  const lightVibrant = generateColor(palette.LightVibrant?.hsl || [0, 0, 0]);
  const darkVibrant = generateColor(palette.DarkVibrant?.hsl || [0, 0, 0]);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex gap-4">
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
          <span
            className="h-12 w-20 rounded-md"
            style={{ backgroundColor: palette?.Vibrant?.hex }}
          />
          <span>Vibrant</span>
        </span>
        <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
          <span className="h-12 w-20 rounded-md" style={{ backgroundColor: palette?.Muted?.hex }} />
          <span>Muted</span>
        </span>
      </div>
      <div className="flex gap-4">
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
          <span
            className="h-12 w-20 rounded-md"
            style={{ backgroundColor: `hsl(${highVibrant})` }}
          />
          <span>highVibrant</span>
        </span>
        <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
          <span
            className="h-12 w-20 rounded-md"
            style={{ backgroundColor: `hsl(${lightVibrant})` }}
          />
          <span>lightVibrant</span>
        </span>
        <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
          <span
            className="h-12 w-20 rounded-md"
            style={{ backgroundColor: `hsl(${darkVibrant})` }}
          />
          <span>darkVibrant</span>
        </span>
        <span className="flex flex-col items-center justify-center gap-2 text-center text-xs">
          <span
            className="h-12 w-20 rounded-md"
            style={{ backgroundColor: `hsl(${darkLightVibrant})` }}
          />
          <span>darkLightVibrant</span>
        </span>
      </div>
    </div>
  );
};

export default DynamicThemeSettings;
