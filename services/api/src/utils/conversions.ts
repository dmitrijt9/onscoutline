// Convert date to YYYY-MM-DD string
export const toOnscoutlineDateFormat = (date?: Date) => {
    const now = date ?? new Date()

    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
        .getDate()
        .toString()
        .padStart(2, '0')}`
}
