
export class ICalStringParseError extends Error {}

export interface ParsedICalString {
  [property: string]: ICalProperty[];
  // @ts-ignore: typescript doesn't like index properties and dictionary propertys of different types
  componentName: string;
  // @ts-ignore
  BEGIN?: ParsedICalString[];
}

export interface ICalProperty {
  [property: string]: string;
  propertyName: string;
  propertyValue: string;
}

const LINE_REGEX = /^.*\n?/;

// Dynamically constructs a regex to match a `BEGIN...END` section
function componentRegex(value: string) {
  return new RegExp(`(BEGIN:${value})(.|\\n)*?(END:${value})\\n?`)
}

function parseLine(input: string) {
  const parts = input.split(':')

  if (parts.length !== 2) {
    throw new Error('Invalid property')
  }

  const [ propertyName, ...params ] = parts[0].split(';')
  const propertyValue = parts[1] && parts[1].replace('\n', '') || ''
  
  let returnObject: ICalProperty = {
    propertyName: propertyName && propertyName.toUpperCase(),
    propertyValue,
  }
  
  params.forEach(param => {
    const splitParam = param.split('=')
    
    if (splitParam.length !== 2) {
      throw new Error('Invalid property param')
    }

    returnObject[splitParam[0]] = splitParam[1]
  })

  return returnObject
}

function removeFirstAndLastLine(input: string): string {
  const lines = input.trim().split('\n');
  lines.shift();
  lines.pop();
  return lines.join('\n');
}

export function parseICalString(
  input: string, 
  options: {componentName?: string, ignoreParsingErrors?: boolean} = {}
): ParsedICalString {
  // return value
  let parsedICalString: ParsedICalString = {
    componentName: options.componentName || 'ROOT' as any,
  };
  
  // remove unnecessary whitespace
  input = input.trim()

  // get the first line
  let match = input.match(LINE_REGEX)
  
  while (match && input) {
    let property: ICalProperty;

    try {
      property = parseLine(match[0])
    }
    catch (e) {
      if (options.ignoreParsingErrors) {
        input = input.replace(LINE_REGEX, '')
        match = input.match(LINE_REGEX)
        continue  
      }
      
      throw new ICalStringParseError(
        `Error parsing line of iCal string: "${match[0]}"`
      )
    }

    if (!parsedICalString[property.propertyName]) {
      parsedICalString[property.propertyName] = []
    }

    if (property.propertyName === 'BEGIN') {
      const regex = componentRegex(property.propertyValue)

      parsedICalString.BEGIN!.push(
        parseICalString(
          removeFirstAndLastLine(input.match(regex)![0]),
          {componentName: property.propertyValue}
        ),
      )
      
      input = input.replace(regex, '');
    }
    else {
      parsedICalString[property.propertyName].push(property)
      input = input.replace(LINE_REGEX, '')
    }

    match = input.match(LINE_REGEX)
  }

  return parsedICalString
}
