import path from 'path';

const getDirectoriesFromPath = (dir: string) => {
  // Use posix paths for consistency across platforms (Nora is cross-platform)
  const posixPath = dir.replace(/\\/g, '/');
  const isAbsolute = path.posix.isAbsolute(posixPath);
  const parts = posixPath.split('/').filter((x) => x);
  // Store whether the original path was absolute so we can preserve it
  return { parts, isAbsolute };
};

const groupDirectoriesFromSamePath = (
  pathDirs: Array<{ parts: string[]; isAbsolute: boolean }>
) => {
  let dirsArr = pathDirs;
  const groupedDirs = [];
  while (dirsArr.length > 0) {
    const dir = dirsArr[0];
    const group = dirsArr.filter((x) => x.parts[0] === dir.parts[0]);
    dirsArr = dirsArr.filter((x) => x.parts[0] !== dir.parts[0]);
    groupedDirs.push(group);
  }
  return groupedDirs;
};

const reduceGroupsToHighestDirectories = (
  groupedDirs: Array<Array<{ parts: string[]; isAbsolute: boolean }>>
) => {
  const output = groupedDirs.map((dirGroup) => {
    const noOfPathsInGroup = dirGroup.map((x) => x.parts.length);
    const indexOfHighestPaths = noOfPathsInGroup.indexOf(Math.min(...noOfPathsInGroup));
    return dirGroup[indexOfHighestPaths];
  });
  return output;
};

const parseGroupsToPaths = (reducedGroups: Array<{ parts: string[]; isAbsolute: boolean }>) => {
  const parsedPaths = reducedGroups.map((dirGroup) => {
    const joinedPath = dirGroup.parts.join('/');
    // Restore the leading separator for absolute paths
    return dirGroup.isAbsolute ? '/' + joinedPath : joinedPath;
  });
  return parsedPaths;
};

const getParentsOfPaths = (parsedPaths: string[]) => {
  const parents = parsedPaths.map((dir) => {
    return path.posix.dirname(dir);
  });
  return parents;
};

const getParentFolderPaths = (dirs: string[]) => {
  const pathDirsArray = dirs.map((x) => getDirectoriesFromPath(x));
  const groupedDirs = groupDirectoriesFromSamePath(pathDirsArray);
  const reducedGroups = reduceGroupsToHighestDirectories(groupedDirs);
  const parsedPaths = parseGroupsToPaths(reducedGroups);
  const parentPaths = getParentsOfPaths(parsedPaths);
  return parentPaths;
};

export default getParentFolderPaths;
