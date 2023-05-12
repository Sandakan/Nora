// Learn more about semantic versioning on https://semver.org/
// Semantic version checking regex from https://regex101.com/r/vkijKf/1/
// Pre-release is in the form (alpha|beta).YYYYMMDDNN where NN is a number in range 0 to 99.

const semVerRegex =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const getVersionInfoFromString = (versionString: string) => {
  const versionData = versionString.match(semVerRegex);

  if (versionData) {
    const [, major, minor, patch, preRelease] = versionData;
    const releasePhase = preRelease.replace(/[^a-zA-Z]/gi, '');

    return { major, minor, patch, preRelease, releasePhase };
  }
  return undefined;
};

const isLatestVersion = (
  latestVersionString: string,
  currentVersionString: string
) => {
  const latestVersion = getVersionInfoFromString(latestVersionString);
  const currentVersion = getVersionInfoFromString(currentVersionString);

  // Lv - Latest Version
  // Cv - Current Version
  if (latestVersion && currentVersion) {
    const {
      major: LvMajor,
      minor: LvMinor,
      patch: LvPatch,
      preRelease: LvPreRelease,
    } = latestVersion;
    const {
      major: CvMajor,
      minor: CvMinor,
      patch: CvPatch,
      preRelease: CvPreRelease,
    } = currentVersion;

    console.log(
      'latest version',
      latestVersion,
      'current version',
      currentVersion
    );

    if (LvMajor > CvMajor) return false;
    if (LvMajor < CvMajor) return true;

    if (LvMinor > CvMinor) return false;
    if (LvMinor < CvMinor) return true;

    if (LvPatch > CvPatch) return false;
    if (LvPatch < CvPatch) return true;

    if (LvPreRelease && !CvPreRelease) return true;
    if (!LvPreRelease && CvPreRelease) return false;
    if (LvPreRelease && CvPreRelease && LvPreRelease !== CvPreRelease) {
      const res = currentVersionString.localeCompare(latestVersionString);

      if (res === 1) return false;
      return true;
    }
  }
  return false;
};

export default isLatestVersion;
