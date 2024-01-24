type NamespacedKey = {
	key: string;
	namespace?: string;
}

export const encodeNamespaceKey = ({ key, namespace }: NamespacedKey) => (namespace ? `${namespace}::${key}` : key);

export const parseNamespaceKey = (value: string): NamespacedKey => {
	const parts = value.split('::');
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
