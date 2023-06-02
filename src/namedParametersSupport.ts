/** Convert named parameter binding format to the hana client index based binding format*/
export function namedParameterBindingSupport(
  query: string,
  params: { [key: string]: any }
): [string, any[]] {
  const paramValues: any[] = [];

  // Replace all parameter placeholders in the query string
  const formattedQuery = query.replaceAll(
    /:(\w+)/g,
    (_matchedSubString, paramName) => {
      const paramValue = params[paramName];

      if (paramValue === undefined) throw new Error(`${paramName} is missing`);

      paramValues.push(paramValue);
      return "?";
    }
  );

  return [formattedQuery, paramValues];
}
