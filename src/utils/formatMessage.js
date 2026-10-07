// Fill {placeholders} in translation strings.
export default function formatMessage(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (
    values[key] === undefined ? match : String(values[key])
  ));
}
