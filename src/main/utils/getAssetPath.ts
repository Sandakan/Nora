import path from 'path';

const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const RESOURCES_PATH = IS_DEVELOPMENT
  ? path.join(__dirname, '../../../assets')
  : path.join(process.resourcesPath, 'assets');

/** Returns the path of the specified asset relative to assets folder. */
const getAssetPath = (...paths: string[]): string =>
  path.join(RESOURCES_PATH, ...paths);

export default getAssetPath;
