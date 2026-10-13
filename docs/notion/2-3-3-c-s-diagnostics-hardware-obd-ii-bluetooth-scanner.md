# 2.3 - 3 C's Diagnostics & Hardware OBD-II Bluetooth Scanner

> 🧭 **Note:** ⬅️ Previous: [10 - Vehicle Intelligence & OEM Telemetry Engine](https://notion.so/3e0968d84bdf813d9100e0c0ca0835fd)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [12 - Inventory Triad & Client Financial Overrides](https://notion.so/3e0968d84bdf816b947bfd503dfdd9dd)


# 11 - 3 C's Diagnostics & Hardware OBD-II Scanner

> ⚡ **Note:** Benchmark: Seamlessly integrates the 3 C's diagnostic methodology with Web Bluetooth ELM327 OBD-II live telemetry.


---


## 1. Working Notes & Functional Overview

High-quality automotive repair relies on thorough diagnosis. MechanicMate implements the industry-standard 3 C's framework alongside real-time hardware scanning directly in the browser via Web Bluetooth.

- The 3 C's: Concern (What customer heard/felt), Cause (What technician found), Correction (How to resolve).
- Zero Native App Required: Connects to standard ELM327 OBD-II Bluetooth adapters straight from Chrome / Edge on Android, Windows, or Mac.
- Live Sensor PIDs: Real-time gauges for Engine RPM, Coolant Temperature, Short/Long Term Fuel Trims, Speed, and Voltage.
- DTC Reading & Clearing: Scans stored and pending Diagnostic Trouble Codes, freeze-frame sensor telemetry, and clears CEL after repair.

## 2. Web Bluetooth Architecture for OBD-II

Web Bluetooth connects directly to the ELM327 BLE characteristic (Standard UUID 0xFFF0 / 0xFFF1 or Nordic UART Service):

```javascript
// Browser Web Bluetooth connection to ELM327
async function connectToOBD() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: "OBD" }, { namePrefix: "ELM" }],
    optionalServices: ["0000fff0-0000-1000-8000-00805f9b34fb"]
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService("0000fff0-0000-1000-8000-00805f9b34fb");
  const rxChar = await service.getCharacteristic("0000fff1-0000-1000-8000-00805f9b34fb");

  // Send AT Initialization commands
  await sendCommand(rxChar, "ATZ\r");   // Reset
  await sendCommand(rxChar, "ATE0\r");  // Echo off
  await sendCommand(rxChar, "ATSP0\r"); // Automatic protocol detection
  await sendCommand(rxChar, "0100\r");  // Supported PIDs
}
```


## 3. Where it is Configured

| Component | Path | Function |
| --- | --- | --- |
| Diagnosis View | app/(dashboard)/jobs/[id]/diagnose/page.tsx | 3 C's form with system classification & DTC selector |
| OBD Scanner View | app/(dashboard)/diagnostics/obd/page.tsx | Hardware pairing guide, PID dials, DTC scanner |
| Scanner Hook | src/hooks/use-obd-scanner.ts | GATT connection lifecycle, PID polling loop, parser |
| Diagnostic Actions | src/actions/diagnostics.ts | saveDiagnosticEntryAction, logObdDtcAction |
| Tables | src/lib/db/schema/diagnostics.ts | diagnostic_entries, obd_scan_records |


## 4. Why it was Built This Way

- Eliminates Third-Party Dongle Software: Mechanics don't need a separate handheld scanner or proprietary app; everything logs directly into the customer's repair history.
- Auditable Records: Storing freeze-frame data alongside the 3 C's gives undeniable proof of fault conditions when communicating with vehicle owners.

---

> 🧭 **Note:** ⬅️ Previous: [10 - Vehicle Intelligence & OEM Telemetry Engine](https://notion.so/3e0968d84bdf813d9100e0c0ca0835fd)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [12 - Inventory Triad & Client Financial Overrides](https://notion.so/3e0968d84bdf816b947bfd503dfdd9dd)

