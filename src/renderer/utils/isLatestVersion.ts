// Learn more about semantic versioning on https://semver.org/
// Semantic version checking regex from https://regex101.com/r/vkijKf/1/
// Pre-release is in the form (alpha|beta).YYYYMMDDNN where NN is a number in range 0 to 99.

const semVerRegex =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

interface VersionInfo {
  major: string;
  minor: string;
  patch: string;
}

interface ExtendedVersionInfo extends VersionInfo {
  preRelease?: string;
  releasePhase?: string;
}

export const getVersionInfoFromString = (
  versionString: string,
): ExtendedVersionInfo | undefined => {
  const versionData = versionString.match(semVerRegex);

  if (versionData) {
    const [, major, minor, patch, preRelease] = versionData;
    const releasePhase = preRelease?.replace(/[^a-zA-Z]/gi, '');

    return { major, minor, patch, preRelease, releasePhase };
  }
  return undefined;
};

const compareMajorMinorAndPatch = (
  Lv: ExtendedVersionInfo,
  Cv: ExtendedVersionInfo,
) => {
  if (Lv.major > Cv.major) return false;
  if (Lv.major < Cv.major) return true;

  if (Lv.minor > Cv.minor) return false;
  if (Lv.minor < Cv.minor) return true;

  if (Lv.patch > Cv.patch) return false;
  if (Lv.patch < Cv.patch) return true;

  return true;
};

const isLatestVersion = (
  latestVersionString: string,
  currentVersionString: string,
) => {
  const latestVersion = getVersionInfoFromString(latestVersionString);
  const currentVersion = getVersionInfoFromString(currentVersionString);

  // Lv - Latest Version
  // Cv - Current Version
  if (latestVersion && currentVersion) {
    const { preRelease: LvPreRelease } = latestVersion;
    const { preRelease: CvPreRelease } = currentVersion;

    console.log('Version details', { latestVersion, currentVersion });

    if (LvPreRelease === CvPreRelease)
      return compareMajorMinorAndPatch(latestVersion, currentVersion);

    if (LvPreRelease && !CvPreRelease) return true;
    if (!LvPreRelease && CvPreRelease) return false;
    if (LvPreRelease && CvPreRelease && LvPreRelease !== CvPreRelease)
      return true;
    return true;
  }
  return false;
};

export default isLatestVersion;
