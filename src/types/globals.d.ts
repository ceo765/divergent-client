declare global {
  // `var` is required for a writable global declaration.
  // eslint-disable-next-line no-var
  var ErrorUtils:
    | {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      }
    | undefined;
}

export {};
