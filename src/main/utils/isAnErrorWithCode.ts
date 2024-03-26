interface ErrorWithErrorCode extends Error {
  code: string;
}

export function isAnErrorWithCode(error: unknown): error is ErrorWithErrorCode {
  return error instanceof Error && 'code' in error;
}
