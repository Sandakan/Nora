const addMissingPropsToAnObject = <T>(
  template: T,
  obj: Partial<T>,
  onMissing?: (missingKey: string) => void
): T => {
  const result: T = { ...(obj as T) };

  for (const key in template) {
    if (!(key in obj)) {
      if (onMissing) onMissing(key);

      if (Array.isArray(template[key])) {
        (result[key] as unknown[]) = (template[key] as unknown[]).slice();
      } else if (typeof template[key] === 'object' && template[key] !== null) {
        result[key] = addMissingPropsToAnObject(template[key], {}, onMissing);
      } else {
        result[key] = template[key];
      }
    } else if (
      typeof template[key] === 'object' &&
      template[key] !== null &&
      !Array.isArray(template[key])
    ) {
      result[key] = addMissingPropsToAnObject(
        template[key],
        obj[key] || {},
        onMissing
      );
    }
  }

  return result;
};

export default addMissingPropsToAnObject;
