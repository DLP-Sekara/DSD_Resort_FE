/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import { getLocalStoragedata } from './StorageHelper';

// Month and day name arrays
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthNamesShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Utility: Get suffix for day number
const getDaySuffix = (day: number) => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
};

/** Output → Joined on 2024 April 28 */
export const formatJoinDate = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `Joined on ${date.getFullYear()} ${monthNames[date.getMonth()]} ${date.getDate()}`;
};

/** Output → 08 AUG 2024 */
export const formatMonthString = (
  dateString: string | number | Date | dayjs.Dayjs | null | undefined,
) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('DD MMM YYYY');
};

/** Output → 12th Jun 2024 */
export const formatDateWithDayExtension = (dateString: string | number | Date) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = monthNamesShort[date.getMonth()];
  const year = date.getFullYear();

  const suffix =
    day > 3 && day < 21 ? 'th' : ['st', 'nd', 'rd'][((day % 10) - 1) % 3] || 'th';

  return `${day}${suffix} ${month} ${year}`;
};

/** Output → 2024 AUG 8 */
export const formatMonthShortString = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()} ${monthNamesShort[date.getMonth()].toUpperCase()} ${date.getDate()}`;
};

/** Output → 2024 August 8 */
export const formatMonthLowerCaseString = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()} ${monthNames[date.getMonth()]} ${date.getDate()}`;
};

/** Output → 8 AUG / THU */
export const formatDateString = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getDate()} ${monthNamesShort[date.getMonth()].toUpperCase()} / ${dayNames[
    date.getDay()
  ].toUpperCase()}`;
};

/** Output → 24th May 2024 */
export const formatDateMonthYear = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getDate()}${getDaySuffix(date.getDate())} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

/** Output → 24th May 2024 (Short month) */
export const formatDateMonthYearShort = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getDate()}${getDaySuffix(date.getDate())} ${monthNamesShort[date.getMonth()]} ${date.getFullYear()}`;
};

/** Output → 2024-12-01 */
export const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

/** Output → 10:10:10 */
export const formatTime = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(
    date.getUTCMinutes(),
  ).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
};

/** Output → 2024-12-01T10:10:10.000Z */
export const convertToISOString = (dateString: string | number | Date) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) throw new Error('Invalid date');
  return date.toISOString();
};

/** Output → 2024-05-01T10:00:00.000+05:30 */
export const createStartDateTime = (
  date: string | number | Date | dayjs.Dayjs | null | undefined,
  time: string,
) => {
  const timeZone = getLocalStoragedata('user').timeZone;
  const match = timeZone?.match(/\( UTC([+-]\d{2}:\d{2}) \)/);
  const offset = match ? match[1] : '+00:00';
  const newDate = dayjs(date).format('YYYY-MM-DD');
  return `${newDate}T${time}:00.000${offset}`;
};

/** Output → 20:10 */
export const formatTimeTo24Hour = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
};

/** Output → 10:10 AM */
export const formatTimeTo12Hour = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

/** Input → "10:10 AM" | Output → "10:10" (24h) */
export const formatTimeAmPmTo24Hour = (timeString: string) => {
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

/** Output → 2024 MAY */
export const formatMonth = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return `${date.getFullYear()} ${monthNames[date.getMonth()].toUpperCase()}`;
};

/** Output → 01/01/2024 */
export const formatDateToDDMMYYYY = (dateString: string | number | Date) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}/${date.getFullYear()}`;
};
