import { ISO8601, ISO8601_NoTime } from '../entities/types'

/**
 * Converts date to YYYY-MM-DD string
 * @param date
 * @returns
 */
export const toOnscoutlineDateFormat = (date?: Date): ISO8601_NoTime => {
    const now = date ?? new Date()

    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
        .getDate()
        .toString()
        .padStart(2, '0')}`
}

/**
 * Converts date to YYYY-MM-DDTHH:mm:ssZ string
 * @param date
 * @returns string
 */
export const toOnscoutlineDateTimeFormat = (date?: Date): ISO8601 => {
    const now = date ?? new Date()

    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
        .getDate()
        .toString()
        .padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}:${now
        .getUTCMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
}

/**
 * Converts weirdo facr localized datetime format to Onscoutline datetime format, which is ISO based.
 * @param facrDateTime Looks like this "Neděle 26. 9. 2021 13:00"
 */
export const fromFacrDateTime = (facrDateTime: string): ISO8601 => {
    const [_, dayNum, month, year, time] = facrDateTime.split(' ')

    const cleanDay = dayNum.replace('.', '').padStart(2, '0')
    const cleanMonth = month.replace('.', '').padStart(2, '0')
    const dateTime = new Date(`${year}-${cleanMonth}-${cleanDay}T${time}`)
    return toOnscoutlineDateTimeFormat(dateTime)
}

/**
 * Converts facr date format to Onscoutline date format, which is ISO based.
 * @param facrDate Looks like this "26.09.2021"
 */
export const fromFacrDate = (facrDate: string): ISO8601_NoTime => {
    const [day, month, year] = facrDate.split('.')
    return toOnscoutlineDateFormat(new Date(+year, +month - 1, +day))
}
