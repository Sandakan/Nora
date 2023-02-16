// Learn more about semantic versioning on https://semver.org/
// Semantic version checking regex from https://regex101.com/r/vkijKf/1/
// Pre-release is in the form (alpha|beta).YYYYMMDDNN where NN is a number in range 0 to 99.

const semVerRegex =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const isLatestVersion = (
  latestVersionString: string,
  currentVersionString: string
) => {
  const latestVersion = latestVersionString.match(semVerRegex);
  const currentVersion = currentVersionString.match(semVerRegex);

  // Lv - Latest Version
  // Cv - Current Version
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

    const isTheLatestVersion = !(LvStr > CvStr || LvPreRelease > CvPreRelease);

    return isTheLatestVersion;
  }
  return false;
};

export default isLatestVersion;
