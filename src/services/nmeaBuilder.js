// ──────────────────────────────────────────────
// NMEA Builder Service
// Converts GPS data into standard NMEA 0183 sentences.
// Used to output data to external hardware (Bluetooth/USB)
// or for simulation purposes.
// ──────────────────────────────────────────────

/**
 * Calculate NMEA Checksum
 * XOR of all characters between '$' and '*'
 */
function calculateChecksum(sentence) {
    let checksum = 0;
    for (let i = 0; i < sentence.length; i++) {
        checksum ^= sentence.charCodeAt(i);
    }
    return checksum.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Format Latitude/Longitude to NMEA format (DDDMM.MMMM)
 */
function formatCoord(value, type) {
    const abs = Math.abs(value);
    const deg = Math.floor(abs);
    const min = (abs - deg) * 60;
    const valStr = `${String(deg).padStart(type === 'lat' ? 2 : 3, '0')}${min.toFixed(4).padStart(7, '0')}`;
    const dir = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
    return { val: valStr, dir };
}

/**
 * Format time to HHMMSS
 */
function formatTime(date) {
    return date.toISOString().substr(11, 8).replace(/:/g, '');
}

/**
 * Format date to DDMMYY
 */
function formatDate(date) {
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = String(date.getUTCFullYear()).slice(-2);
    return `${d}${m}${y}`;
}

/**
 * Build GPGGA Sentence (Global Positioning System Fix Data)
 * $GPGGA,HHMMSS.ss,DDMM.MMMM,N,DDDMM.MMMM,E,Q,SS,H.H,A.A,M,G.G,M,D.D,0000*CS
 */
export function buildGPGGA(position) {
    const { lat, lng, timestamp, accuracy, altitude = 0 } = position;
    const date = new Date(timestamp);
    const timeStr = formatTime(date);
    const latData = formatCoord(lat, 'lat');
    const lngData = formatCoord(lng, 'lng');
    
    // Quality: 1 = GPS fix, 0 = Invalid
    const quality = 1;
    const satellites = 8; // Simulated
    const hdop = (accuracy / 10).toFixed(1); // Rough estimate
    
    const body = `GPGGA,${timeStr},${latData.val},${latData.dir},${lngData.val},${lngData.dir},${quality},${satellites},${hdop},${altitude},M,0,M,,0000`;
    const checksum = calculateChecksum(body);
    
    return `$${body}*${checksum}`;
}

/**
 * Build GPRMC Sentence (Recommended Minimum Specific GPS/Transit Data)
 * $GPRMC,HHMMSS.ss,A,DDMM.MMMM,N,DDDMM.MMMM,E,S.S,H.H,DDMMYY,D.D,E*CS
 */
export function buildGPRMC(position) {
    const { lat, lng, timestamp, speed = 0, heading = 0 } = position;
    const date = new Date(timestamp);
    const timeStr = formatTime(date);
    const dateStr = formatDate(date);
    const latData = formatCoord(lat, 'lat');
    const lngData = formatCoord(lng, 'lng');
    
    // Speed in knots
    const knots = (speed * 1.94384).toFixed(1);
    const course = (heading || 0).toFixed(1);
    
    // Status: A = Active, V = Void
    const status = 'A';
    // Variation: Simulated 0.0 W
    
    const body = `GPRMC,${timeStr},${status},${latData.val},${latData.dir},${lngData.val},${lngData.dir},${knots},${course},${dateStr},,`;
    const checksum = calculateChecksum(body);
    
    return `$${body}*${checksum}`;
}

/**
 * Build AIVDM Sentence (AIS VHF Data-link Message) - SIMULATED 
 * Only generates a dummy Type 1 position report for testing visualization.
 * Real AIVDM encoding is bit-complex (Sixbit ASCII).
 */
export function buildAIVDM(position, mmsi = '419123456') {
    // This is a PRE-CALCULATED static payload for demo purposes
    // because real 6-bit AIS encoding is too heavy for this snippet.
    // In a real app, use 'ais-encoder' npm package.
    
    const body = `AIVDM,1,1,,A,15CvhK0000000000000000000000,0`;
    const checksum = calculateChecksum(body);
    return `!${body}*${checksum} (Simulated AIS Type 1)`;
}

export function generateNMEABlock(position) {
    return [
        buildGPGGA(position),
        buildGPRMC(position),
        // Randomly add AIS msg
        Math.random() > 0.8 ? buildAIVDM(position) : null
    ].filter(Boolean).join('\n');
}
