// Add an HTTPS download URL or a path relative to /private-beta/ for each build.
// Example local path: '../uploads/timefield-beta.zip'. Leave null until available.
export const downloads = [
  {
    slug: 'tsync-bundle',
    name: 'T-SYNC, DEADBEAT & WAVE HORROR',
    url: '../uploads/private-beta/TSync_Deadbeat_WaveH-Beta.zip',
    checksumUrl: '../uploads/private-beta/TSync_Deadbeat_WaveH-Beta.zip.sha256',
  },
  { slug: 'timefield', name: 'TimeField 0.9.0', label: 'Download Windows VST3 ↓', url: '../uploads/private-beta/TimeField-0.9.0-Windows-VST3-Beta.zip', checksumUrl: '../uploads/private-beta/TimeField-0.9.0-Windows-VST3-Beta.zip.sha256' },
  { slug: 'stretch', name: 'STRETCH 0.3.0', label: 'Download Windows VST3 ↓', url: '../uploads/private-beta/Stretch-0.3.0-Windows-VST3-Beta.zip', checksumUrl: '../uploads/private-beta/Stretch-0.3.0-Windows-VST3-Beta.zip.sha256' },
];
