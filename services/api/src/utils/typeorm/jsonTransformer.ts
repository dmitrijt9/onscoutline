export const jsonTransformer = (propertyName: string) => {
    return {
        to: JSON.stringify,
        from: (propertyValue: string) => {
            try {
                return JSON.parse(propertyValue)
            } catch (e) {
                throw new Error(
                    `Invalid string data found in the DB at column: ${propertyName}. This is a data inconsistency error and should not happen! Fix your data!`,
                )
            }
        },
    }
}
