import path from 'path';

const getDirectoriesFromPath = (dir: string) => {
  const { sep } = path;
  return dir.split(sep).filter((x) => x);
};

const groupDirectoriesFromSamePath = (pathDirs: string[][]) => {
  let dirsArr = pathDirs;
  const groupedDirs = [];
  while (dirsArr.length > 0) {
    const dir = dirsArr[0];
    const group = dirsArr.filter((x) => x[0] === dir[0]);
    dirsArr = dirsArr.filter((x) => x[0] !== dir[0]);
    groupedDirs.push(group);
  }
  return groupedDirs;
};

const reduceGroupsToHighestDirectories = (groupedDirs: string[][][]) => {
  const output = groupedDirs.map((dirGroup) => {
    const noOfPathsInGroup = dirGroup.map((x) => x.length);
    const indexOfHighestPaths = noOfPathsInGroup.indexOf(
      Math.min(...noOfPathsInGroup),
    );
    return dirGroup[indexOfHighestPaths];
  });
  return output;
};

const parseGroupsToPaths = (reducedGroups: string[][]) => {
  const { sep } = path;
  const parsedPaths = reducedGroups.map((dirGroup) => {
    return dirGroup.join(sep);
  });
  return parsedPaths;
};

const getParentsOfPaths = (parsedPaths: string[]) => {
  const parents = parsedPaths.map((dir) => {
    return path.dirname(dir);
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
