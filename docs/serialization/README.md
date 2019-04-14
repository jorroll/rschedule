Two optional packages exist for handling serializing / deserializing rSchedule objects.

- For iCal support, use the [optional `ical-tools` package](./ical).

- For standard json support, use the [optional `json-tools` package](./json).

The `json-tools` package is much smaller than the `ical-tools` package and it also supports serializing all `OccurrenceGenerator` objects (unlike `ical-tools`), so it should be your default choice.