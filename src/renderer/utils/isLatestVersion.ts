// Learn more about semantic versioning on https://semver.org/
// Semantic version checking regex from https://regex101.com/r/vkijKf/1/
// Pre-release is in the form (alpha|beta).YYYYMMDDNN where NN is a number in range 0 to 99.

const semVerRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const isLatestVersion = (
  latestVersionString: string,
  currentVersionString: string
) => {
  // Lv - Latest Version
  const latestVersion = latestVersionString.match(semVerRegex);
  // Cv - Current Version
  const currentVersion = currentVersionString.split('-');

  if (latestVersion && currentVersion) {
    const [, LvMajor, LvMinor, LvPatch, LvPreRelease] = latestVersion;
    const [, CvMajor, CvMinor, CvPatch, CvPreRelease] = currentVersion;

    console.log(
      'latest version',
      latestVersion,
      'current version',
      currentVersion
    );

    const LvStr = `${LvMajor}.${LvMinor}.${LvPatch}`;
    const CvStr = `${CvMajor}.${CvMinor}.${CvPatch}`;

    const isLatest = !(LvStr > CvStr || LvPreRelease > CvPreRelease);

    return isLatest;
  }
  return false;
};

export default isLatestVersion;
