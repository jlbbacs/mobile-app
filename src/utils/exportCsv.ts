import { Platform, Share } from 'react-native';
import type { RegistrationRecord } from '../types/registration';

const CSV_COLUMNS: Array<{ header: string; key: keyof RegistrationRecord }> = [
  { header: 'Timestamp', key: 'timestamp' },
  { header: 'Registration ID', key: 'registrationId' },
  { header: 'First Name', key: 'firstName' },
  { header: 'Middle Name', key: 'middleName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Age', key: 'age' },
  { header: 'Sex', key: 'sex' },
  { header: 'Civil Status', key: 'civilStatus' },
  { header: 'Nationality', key: 'nationality' },
  { header: 'Phone Number', key: 'phoneNumber' },
  { header: 'Email', key: 'email' },
  { header: 'Complete Address', key: 'completeAddress' },
  { header: 'Image URL', key: 'imageUrl' },
  { header: 'QR Code URL', key: 'qrCodeUrl' },
  { header: 'Status', key: 'status' },
];

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(records: RegistrationRecord[]): string {
  const lines = [CSV_COLUMNS.map((c) => c.header).join(',')];
  for (const record of records) {
    lines.push(CSV_COLUMNS.map((c) => escapeCell(String(record[c.key] ?? ''))).join(','));
  }
  return lines.join('\n');
}

/**
 * On web, triggers a real file download. On native, opens the share sheet so
 * the CSV can be sent to any app (Files, Gmail, Sheets, ...).
 */
export async function exportRecordsAsCsv(records: RegistrationRecord[]): Promise<void> {
  const csv = buildCsv(records);
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: csv });
  }
}
