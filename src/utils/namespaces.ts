type NamespacedKey = {
	key: string;
	namespace?: string;
}

const NAMESPACE_SEPARATOR = '::';

export const encodeNamespaceKey = ({ key, namespace }: NamespacedKey) => (namespace ? `${namespace}${NAMESPACE_SEPARATOR}${key}` : key);

export const parseNamespaceKey = (value: string): NamespacedKey => {
	const parts = value.split(NAMESPACE_SEPARATOR);
	if (parts.length === 2) {
		return {
			namespace: parts[0],
			key: parts[1],
		};
	}

	return {
		key: value,
	};
};
