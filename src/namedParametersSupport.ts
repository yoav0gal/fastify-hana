/**
Convert named parameter binding format to the hana client index based binding format.
@param {string} query - The query string with named parameter placeholders.
@param {object} params - An object containing the parameter values.
@returns {Array} A tuple with the formatted query string and an array of parameter values.
@throws {Error} If a named parameter is missing in the provided parameters object.
*/
export function namedParameterBindingSupport(
  query: string,
  params: { [key: string]: any }
): [string, any[]] {
  const paramValues: any[] = [];

  // Replace all parameter placeholders in the query string
  const formattedQuery = query.replaceAll(
    /(?<!:):(\w+)/g,
    (_matchedSubString, paramName) => {
      const paramValue = params[paramName];

      if (paramValue === undefined) throw new Error(`${paramName} is missing`);

      paramValues.push(paramValue);
      return "?";
    }
  );

  return [formattedQuery, paramValues];
}
