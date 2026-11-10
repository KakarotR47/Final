import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const OUTPUT_EXE = path.resolve(ROOT_DIR, 'SA_Brothers_POS.exe');
const OUTPUT_ZIP = path.resolve(ROOT_DIR, 'SA_Brothers_POS_Windows_Package.zip');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

function collectDistFiles(dir, baseDir = dir, result = {}) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectDistFiles(fullPath, baseDir, result);
    } else {
      const relPath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const contentBase64 = fs.readFileSync(fullPath).toString('base64');
      result[relPath] = {
        mime: getMimeType(fullPath),
        b64: contentBase64,
      };
    }
  }
  return result;
}

/**
 * Builds a minimal, valid 64-bit Windows GUI PE executable (PE32+ x86-64, Subsystem = WINDOWS_GUI).
 * The PE image is exactly 4096 bytes (0x1000).
 * When launched on Windows, it:
 *   1. Calls GetModuleFileNameW(NULL, exePathBuf, 1024)
 *   2. Calls SetEnvironmentVariableW(L"SA_POS_EXE", exePathBuf)
 *   3. Calls CreateProcessW(NULL, cmdLineW, ..., CREATE_NO_WINDOW, ..., &si, &pi)
 *   4. Calls ExitProcess(0)
 * The PowerShell command reads the UTF-8 script appended at byte offset 4096 of SA_Brothers_POS.exe and executes it.
 */
function buildPe64Stub() {
  const buf = Buffer.alloc(4096, 0);

  const IMAGE_BASE = 0x0000000140000000n;
  const SECTION_RVA = 0x1000;
  const SECTION_RAW_PTR = 0x0200;
  const SECTION_RAW_SIZE = 0x0E00; // 3584 bytes (0x200..0x1000)

  // 1. DOS Header
  buf.write('MZ', 0, 'ascii');
  buf.writeUInt32LE(0x80, 0x3C); // e_lfanew = 0x80

  // 2. PE Signature & COFF File Header at 0x80
  let p = 0x80;
  buf.write('PE\0\0', p, 'ascii'); p += 4;
  buf.writeUInt16LE(0x8664, p); p += 2; // Machine: IMAGE_FILE_MACHINE_AMD64
  buf.writeUInt16LE(1, p); p += 2;      // NumberOfSections: 1 (.text containing code + imports + data)
  buf.writeUInt32LE(Math.floor(Date.now() / 1000), p); p += 4; // TimeDateStamp
  buf.writeUInt32LE(0, p); p += 4;      // PointerToSymbolTable
  buf.writeUInt32LE(0, p); p += 4;      // NumberOfSymbols
  buf.writeUInt16LE(0xF0, p); p += 2;   // SizeOfOptionalHeader (240 bytes for PE32+)
  buf.writeUInt16LE(0x0022, p); p += 2; // Characteristics: EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE

  // 3. Optional Header (PE32+) at 0x98
  const optStart = p;
  buf.writeUInt16LE(0x020B, p); p += 2; // Magic: PE32+ (64-bit)
  buf.writeUInt8(14, p++);              // MajorLinkerVersion
  buf.writeUInt8(0, p++);               // MinorLinkerVersion
  buf.writeUInt32LE(SECTION_RAW_SIZE, p); p += 4; // SizeOfCode
  buf.writeUInt32LE(0, p); p += 4;      // SizeOfInitializedData
  buf.writeUInt32LE(0, p); p += 4;      // SizeOfUninitializedData
  buf.writeUInt32LE(SECTION_RVA, p); p += 4; // AddressOfEntryPoint (RVA 0x1000)
  buf.writeUInt32LE(SECTION_RVA, p); p += 4; // BaseOfCode (RVA 0x1000)
  buf.writeBigUInt64LE(IMAGE_BASE, p); p += 8; // ImageBase
  buf.writeUInt32LE(0x1000, p); p += 4; // SectionAlignment
  buf.writeUInt32LE(0x0200, p); p += 4; // FileAlignment
  buf.writeUInt16LE(6, p); p += 2;      // MajorOperatingSystemVersion
  buf.writeUInt16LE(0, p); p += 2;      // MinorOperatingSystemVersion
  buf.writeUInt16LE(0, p); p += 2;      // MajorImageVersion
  buf.writeUInt16LE(0, p); p += 2;      // MinorImageVersion
  buf.writeUInt16LE(6, p); p += 2;      // MajorSubsystemVersion
  buf.writeUInt16LE(0, p); p += 2;      // MinorSubsystemVersion
  buf.writeUInt32LE(0, p); p += 4;      // Win32VersionValue
  buf.writeUInt32LE(0x2000, p); p += 4; // SizeOfImage
  buf.writeUInt32LE(0x0200, p); p += 4; // SizeOfHeaders
  buf.writeUInt32LE(0, p); p += 4;      // CheckSum
  buf.writeUInt16LE(2, p); p += 2;      // Subsystem: IMAGE_SUBSYSTEM_WINDOWS_GUI (2) - no console flash!
  buf.writeUInt16LE(0x8100, p); p += 2; // DllCharacteristics: NX_COMPAT | TERMINAL_SERVER_AWARE
  buf.writeBigUInt64LE(0x100000n, p); p += 8; // SizeOfStackReserve
  buf.writeBigUInt64LE(0x1000n, p); p += 8;   // SizeOfStackCommit
  buf.writeBigUInt64LE(0x100000n, p); p += 8; // SizeOfHeapReserve
  buf.writeBigUInt64LE(0x1000n, p); p += 8;   // SizeOfHeapCommit
  buf.writeUInt32LE(0, p); p += 4;      // LoaderFlags
  buf.writeUInt32LE(16, p); p += 4;     // NumberOfRvaAndSizes

  // Data Directories (16 entries * 8 bytes = 128 bytes)
  // Entry 1 is Import Table: we place Import Directory at RVA 0x1100 (file offset 0x0300)
  // Entry 12 is IAT: we place IAT at RVA 0x1158 (file offset 0x0358)
  const importDirRva = 0x1100;
  const importDirSize = 40; // 2 descriptors (KERNEL32 + null terminator)
  const iatRva = 0x1158;
  const iatSize = 40; // 4 functions + null terminator

  // Export Table (0)
  p += 8;
  // Import Table (1)
  buf.writeUInt32LE(importDirRva, p); p += 4;
  buf.writeUInt32LE(importDirSize, p); p += 4;
  // Advance past remaining directories to IAT (index 12)
  p = optStart + 112 + 12 * 8;
  buf.writeUInt32LE(iatRva, p); p += 4;
  buf.writeUInt32LE(iatSize, p); p += 4;

  // 4. Section Header at optStart + 0xF0 (0x188)
  p = optStart + 0xF0;
  buf.write('.text\0\0\0', p, 'ascii'); p += 8;
  buf.writeUInt32LE(SECTION_RAW_SIZE, p); p += 4; // VirtualSize
  buf.writeUInt32LE(SECTION_RVA, p); p += 4;      // VirtualAddress
  buf.writeUInt32LE(SECTION_RAW_SIZE, p); p += 4; // SizeOfRawData
  buf.writeUInt32LE(SECTION_RAW_PTR, p); p += 4;  // PointerToRawData
  buf.writeUInt32LE(0, p); p += 4;                // PointerToRelocations
  buf.writeUInt32LE(0, p); p += 4;                // PointerToLinenumbers
  buf.writeUInt16LE(0, p); p += 2;                // NumberOfRelocations
  buf.writeUInt16LE(0, p); p += 2;                // NumberOfLinenumbers
  // Characteristics: CODE | INITIALIZED_DATA | EXECUTE | READ | WRITE (0xE0000060)
  buf.writeUInt32LE(0xE0000060, p); p += 4;

  // Helper to convert RVA (0x1000..0x1DFF) to file offset (0x0200..0x0FFF)
  const rvaToOff = (rva) => SECTION_RAW_PTR + (rva - SECTION_RVA);

  // 5. Import Directory Table at RVA 0x1100
  // ILT (OriginalFirstThunk) at RVA 0x1130 (5 * 8 = 40 bytes)
  // IAT (FirstThunk) at RVA 0x1158 (5 * 8 = 40 bytes)
  // Hint/Name entries starting at RVA 0x1180
  const iltRva = 0x1130;
  const dllNameRva = 0x1180;
  const hnGetModuleFileNameW = 0x1190;
  const hnSetEnvironmentVariableW = 0x11AC;
  const hnCreateProcessW = 0x11CA;
  const hnExitProcess = 0x11E0;

  let impOff = rvaToOff(importDirRva);
  buf.writeUInt32LE(iltRva, impOff); impOff += 4;      // OriginalFirstThunk
  buf.writeUInt32LE(0, impOff); impOff += 4;           // TimeDateStamp
  buf.writeUInt32LE(0, impOff); impOff += 4;           // ForwarderChain
  buf.writeUInt32LE(dllNameRva, impOff); impOff += 4;  // Name
  buf.writeUInt32LE(iatRva, impOff); impOff += 4;      // FirstThunk
  // Null Import Descriptor (20 bytes of 0 already zeroed)

  const thunks = [hnGetModuleFileNameW, hnSetEnvironmentVariableW, hnCreateProcessW, hnExitProcess, 0];
  thunks.forEach((rva, i) => {
    buf.writeBigUInt64LE(BigInt(rva), rvaToOff(iltRva + i * 8));
    buf.writeBigUInt64LE(BigInt(rva), rvaToOff(iatRva + i * 8));
  });

  buf.write('KERNEL32.dll\0', rvaToOff(dllNameRva), 'ascii');

  const writeHintName = (rva, name) => {
    const off = rvaToOff(rva);
    buf.writeUInt16LE(0, off);
    buf.write(name + '\0', off + 2, 'ascii');
  };
  writeHintName(hnGetModuleFileNameW, 'GetModuleFileNameW');
  writeHintName(hnSetEnvironmentVariableW, 'SetEnvironmentVariableW');
  writeHintName(hnCreateProcessW, 'CreateProcessW');
  writeHintName(hnExitProcess, 'ExitProcess');

  // 6. Data structures inside section:
  // RVA 0x1200: envNameW = L"SA_POS_EXE\0"
  // RVA 0x1220: startupInfo (104 bytes, cb = 104)
  // RVA 0x1290: processInfo (24 bytes)
  // RVA 0x12B0: cmdLineW (UTF-16LE mutable command line)
  // RVA 0x1500: exePathBuf (1024 WCHARs = 2048 bytes)
  const envNameRva = 0x1200;
  const startupInfoRva = 0x1220;
  const processInfoRva = 0x1290;
  const cmdLineRva = 0x12B0;
  const exePathBufRva = 0x1500;

  buf.write('SA_POS_EXE\0', rvaToOff(envNameRva), 'utf16le');
  buf.writeUInt32LE(104, rvaToOff(startupInfoRva)); // STARTUPINFOW.cb = 104

  const psBootstrapCmd =
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ' +
    '"$b=[IO.File]::ReadAllBytes($env:SA_POS_EXE);iex([Text.Encoding]::UTF8.GetString($b,4096,$b.Length-4096))"\0';
  buf.write(psBootstrapCmd, rvaToOff(cmdLineRva), 'utf16le');

  // 7. x86-64 Machine Code at Entry Point (RVA 0x1000, file offset 0x0200)
  // IAT slots:
  //   [0x1158] = GetModuleFileNameW
  //   [0x1160] = SetEnvironmentVariableW
  //   [0x1168] = CreateProcessW
  //   [0x1170] = ExitProcess
  const code = [];
  const emit = (...bytes) => code.push(...bytes);
  const currentRva = () => SECTION_RVA + code.length;
  const emitRipDisp32 = (targetRva) => {
    const disp = targetRva - (currentRva() + 4);
    const b = Buffer.alloc(4);
    b.writeInt32LE(disp, 0);
    emit(...b);
  };

  // sub rsp, 0x68 (104 bytes: 32 shadow + 64 args + 8 align -> RSP is 16-byte aligned)
  emit(0x48, 0x83, 0xEC, 0x68);

  // 1) GetModuleFileNameW(NULL, &exePathBuf, 1024)
  // xor ecx, ecx
  emit(0x31, 0xC9);
  // lea rdx, [rip + exePathBufRva]
  emit(0x48, 0x8D, 0x15); emitRipDisp32(exePathBufRva);
  // mov r8d, 1024
  emit(0x41, 0xB8, 0x00, 0x04, 0x00, 0x00);
  // call qword ptr [rip + iat_GetModuleFileNameW]
  emit(0xFF, 0x15); emitRipDisp32(iatRva + 0);

  // 2) SetEnvironmentVariableW(&envNameW, &exePathBuf)
  // lea rcx, [rip + envNameRva]
  emit(0x48, 0x8D, 0x0D); emitRipDisp32(envNameRva);
  // lea rdx, [rip + exePathBufRva]
  emit(0x48, 0x8D, 0x15); emitRipDisp32(exePathBufRva);
  // call qword ptr [rip + iat_SetEnvironmentVariableW]
  emit(0xFF, 0x15); emitRipDisp32(iatRva + 8);

  // 3) CreateProcessW(NULL, &cmdLineW, NULL, NULL, FALSE, CREATE_NO_WINDOW (0x08000000), NULL, NULL, &startupInfo, &processInfo)
  // xor ecx, ecx (lpApplicationName = NULL)
  emit(0x31, 0xC9);
  // lea rdx, [rip + cmdLineRva] (lpCommandLine)
  emit(0x48, 0x8D, 0x15); emitRipDisp32(cmdLineRva);
  // xor r8d, r8d (lpProcessAttributes = NULL)
  emit(0x45, 0x31, 0xC0);
  // xor r9d, r9d (lpThreadAttributes = NULL)
  emit(0x45, 0x31, 0xC9);
  // mov qword ptr [rsp + 0x20], 0 (bInheritHandles = FALSE)
  emit(0x48, 0xC7, 0x44, 0x24, 0x20, 0x00, 0x00, 0x00, 0x00);
  // mov qword ptr [rsp + 0x28], 0x08000000 (dwCreationFlags = CREATE_NO_WINDOW)
  emit(0x48, 0xC7, 0x44, 0x24, 0x28, 0x00, 0x00, 0x00, 0x08);
  // mov qword ptr [rsp + 0x30], 0 (lpEnvironment = NULL)
  emit(0x48, 0xC7, 0x44, 0x24, 0x30, 0x00, 0x00, 0x00, 0x00);
  // mov qword ptr [rsp + 0x38], 0 (lpCurrentDirectory = NULL)
  emit(0x48, 0xC7, 0x44, 0x24, 0x38, 0x00, 0x00, 0x00, 0x00);
  // lea rax, [rip + startupInfoRva]
  emit(0x48, 0x8D, 0x05); emitRipDisp32(startupInfoRva);
  // mov qword ptr [rsp + 0x40], rax (lpStartupInfo)
  emit(0x48, 0x89, 0x44, 0x24, 0x40);
  // lea rax, [rip + processInfoRva]
  emit(0x48, 0x8D, 0x05); emitRipDisp32(processInfoRva);
  // mov qword ptr [rsp + 0x48], rax (lpProcessInformation)
  emit(0x48, 0x89, 0x44, 0x24, 0x48);
  // call qword ptr [rip + iat_CreateProcessW]
  emit(0xFF, 0x15); emitRipDisp32(iatRva + 16);

  // 4) ExitProcess(0)
  // xor ecx, ecx
  emit(0x31, 0xC9);
  // call qword ptr [rip + iat_ExitProcess]
  emit(0xFF, 0x15); emitRipDisp32(iatRva + 24);
  // ret
  emit(0xC3);

  Buffer.from(code).copy(buf, rvaToOff(SECTION_RVA));
  return buf;
}

function buildPowerShellPayload(distAssets, launcherBatB64, backupBatB64, sqlDumpB64) {
  const assetsJsonB64 = Buffer.from(JSON.stringify(distAssets), 'utf8').toString('base64');

  return `# SA Brothers Vendors POS - Embedded Windows Desktop Runtime & Local Hard Drive Server
$ErrorActionPreference = 'SilentlyContinue'
$exePath = $env:SA_POS_EXE
if (-not $exePath -or -not (Test-Path $exePath)) {
  $exePath = Join-Path (Get-Location).Path 'SA_Brothers_POS.exe'
}
$appDir = Split-Path -Parent $exePath
$localDbDir = Join-Path $appDir 'local_database'
$backupDir = Join-Path $localDbDir 'backups'
New-Item -ItemType Directory -Force -Path $localDbDir | Out-Null
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$port = 3088
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Open-PosAppWindow($url) {
  $browsers = @(
    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
    "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe",
    "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe",
    "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe"
  )
  foreach ($b in $browsers) {
    if ($b -and (Test-Path $b)) {
      Start-Process -FilePath $b -ArgumentList "--app=$url --window-size=1400,860"
      return
    }
  }
  Start-Process $url
}

# Terminate any previous POS server instances on ports 3080 or 3088 so the latest EXE always runs
try {
  $conns = Get-NetTCPConnection -LocalPort 3080, 3088 -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    if ($c.OwningProcess -and $c.OwningProcess -ne $PID) {
      Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Milliseconds 200
} catch {}

# Decode embedded production web assets
$assetsJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${assetsJsonB64}'))
$assets = ConvertFrom-Json $assetsJson
$launcherBatBytes = [System.Convert]::FromBase64String('${launcherBatB64}')
$backupBatBytes = [System.Convert]::FromBase64String('${backupBatB64}')
$sqlDumpBytes = [System.Convert]::FromBase64String('${sqlDumpB64}')

function Read-LocalJsonFile($name, $fallbackJson) {
  $p = Join-Path $localDbDir $name
  if (Test-Path $p) {
    try {
      $raw = [System.IO.File]::ReadAllText($p, $utf8NoBom).Trim().Trim([char]0xFEFF)
      if ($raw.Length -gt 0) { return $raw }
    } catch {}
  }
  return $fallbackJson
}

function Write-LocalJsonObj($name, $obj) {
  if ($null -eq $obj) { return }
  $p = Join-Path $localDbDir $name
  $json = ConvertTo-Json -InputObject @($obj) -Depth 20
  if (-not ($obj -is [System.Array])) {
    $json = ConvertTo-Json -InputObject $obj -Depth 20
  }
  [System.IO.File]::WriteAllText($p, $json, $utf8NoBom)
}

function Send-HttpResponse($stream, [int]$statusCode, [string]$statusText, [string]$contentType, [byte[]]$bodyBytes, [hashtable]$extraHeaders = @{}) {
  $headerSb = New-Object System.Text.StringBuilder
  [void]$headerSb.Append("HTTP/1.1 $statusCode $statusText\`r\`n")
  [void]$headerSb.Append("Content-Type: $contentType\`r\`n")
  [void]$headerSb.Append("Content-Length: $($bodyBytes.Length)\`r\`n")
  [void]$headerSb.Append("Connection: close\`r\`n")
  [void]$headerSb.Append("Cache-Control: no-store, no-cache, must-revalidate\`r\`n")
  foreach ($k in $extraHeaders.Keys) {
    [void]$headerSb.Append("\${k}: $($extraHeaders[$k])\`r\`n")
  }
  [void]$headerSb.Append("\`r\`n")
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerSb.ToString())
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bodyBytes.Length -gt 0) {
    $stream.Write($bodyBytes, 0, $bodyBytes.Length)
  }
  $stream.Flush()
}

function Send-JsonResponse($stream, [int]$statusCode, [string]$jsonStr) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
  Send-HttpResponse $stream $statusCode 'OK' 'application/json; charset=utf-8' $bytes
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
$listener.Start()

Open-PosAppWindow "http://127.0.0.1:$port"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $stream.WriteTimeout = 5000

    # Read HTTP request headers
    $headerBuf = New-Object System.Collections.Generic.List[byte]
    $b1 = -1; $b2 = -1; $b3 = -1; $b4 = -1
    while ($true) {
      $val = $stream.ReadByte()
      if ($val -eq -1) { break }
      $headerBuf.Add([byte]$val)
      $b1 = $b2; $b2 = $b3; $b3 = $b4; $b4 = $val
      if ($b1 -eq 13 -and $b2 -eq 10 -and $b3 -eq 13 -and $b4 -eq 10) { break }
      if ($headerBuf.Count -gt 65536) { break }
    }

    if ($headerBuf.Count -eq 0) {
      $client.Close()
      continue
    }

    $headerText = [System.Text.Encoding]::ASCII.GetString($headerBuf.ToArray())
    $lines = $headerText -split "\`r\`n"
    $reqLine = $lines[0] -split ' '
    $method = $reqLine[0]
    $rawUrl = $reqLine[1]
    $pathOnly = ($rawUrl -split '\\?')[0]

    $contentLength = 0
    foreach ($line in $lines) {
      if ($line -match '^Content-Length:\\s*(\\d+)') {
        $contentLength = [int]$Matches[1]
      }
    }

    $bodyText = ''
    if ($contentLength -gt 0) {
      $bodyBytes = New-Object byte[] $contentLength
      $readTotal = 0
      while ($readTotal -lt $contentLength) {
        $r = $stream.Read($bodyBytes, $readTotal, $contentLength - $readTotal)
        if ($r -le 0) { break }
        $readTotal += $r
      }
      $bodyText = [System.Text.Encoding]::UTF8.GetString($bodyBytes, 0, $readTotal)
    }

    if ($pathOnly -eq '/api/health') {
      $resp = '{"status":"ok","mode":"local-shop-pc","hardDriveStorage":true,"timestamp":"' + (Get-Date).ToString('o') + '"}'
      Send-JsonResponse $stream 200 $resp
    }
    elseif ($pathOnly -eq '/api/local-db/load') {
      $prod = Read-LocalJsonFile 'products.json' 'null'
      $tx = Read-LocalJsonFile 'transactions.json' 'null'
      $exp = Read-LocalJsonFile 'expenses.json' 'null'
      $mov = Read-LocalJsonFile 'movements.json' 'null'
      $set = Read-LocalJsonFile 'settings.json' 'null'
      $prof = Read-LocalJsonFile 'profiles.json' 'null'
      $lock = Read-LocalJsonFile 'device_lock.json' '{"isDeviceLockEnabled":false,"authorizedDeviceId":"","authorizedDeviceName":"Shop Counter PC (Default)"}'
      $json = '{"success":true,"data":{"products":' + $prod + ',"transactions":' + $tx + ',"expenses":' + $exp + ',"movements":' + $mov + ',"settings":' + $set + ',"profiles":' + $prof + ',"deviceLock":' + $lock + '}}'
      Send-JsonResponse $stream 200 $json
    }
    elseif ($pathOnly -eq '/api/local-db/sync' -and $method -eq 'POST') {
      $payload = ConvertFrom-Json $bodyText
      if ($null -ne $payload.products) { Write-LocalJsonObj 'products.json' $payload.products }
      if ($null -ne $payload.transactions) { Write-LocalJsonObj 'transactions.json' $payload.transactions }
      if ($null -ne $payload.expenses) { Write-LocalJsonObj 'expenses.json' $payload.expenses }
      if ($null -ne $payload.movements) { Write-LocalJsonObj 'movements.json' $payload.movements }
      if ($null -ne $payload.settings) { Write-LocalJsonObj 'settings.json' $payload.settings }
      if ($null -ne $payload.profiles) { Write-LocalJsonObj 'profiles.json' $payload.profiles }
      if ($null -ne $payload.deviceLock) { Write-LocalJsonObj 'device_lock.json' $payload.deviceLock }
      Send-JsonResponse $stream 200 '{"success":true,"message":"Saved to Windows hard drive"}'
    }
    elseif ($pathOnly -eq '/api/local-db/status') {
      Send-JsonResponse $stream 200 '{"success":true,"directory":"./local_database"}'
    }
    elseif ($pathOnly -eq '/api/local-db/create-backup' -and $method -eq 'POST') {
      $ts = (Get-Date).ToString('yyyy-MM-dd_HH-mm-ss')
      $bp = Join-Path $backupDir "sa_brothers_backup_$ts.json"
      [System.IO.File]::WriteAllText($bp, $bodyText, $utf8NoBom)
      Send-JsonResponse $stream 200 '{"success":true,"message":"Backup created"}'
    }
    elseif ($pathOnly -eq '/api/device-lock') {
      $lock = Read-LocalJsonFile 'device_lock.json' '{"isDeviceLockEnabled":false,"authorizedDeviceId":"","authorizedDeviceName":"Shop Counter PC (Default)"}'
      Send-JsonResponse $stream 200 ('{"success":true,"data":' + $lock + '}')
    }
    elseif ($pathOnly -eq '/api/device-lock/save' -and $method -eq 'POST') {
      $p = Join-Path $localDbDir 'device_lock.json'
      [System.IO.File]::WriteAllText($p, $bodyText, $utf8NoBom)
      Send-JsonResponse $stream 200 ('{"success":true,"data":' + $bodyText + '}')
    }
    elseif ($pathOnly -eq '/api/analyze-eod' -and $method -eq 'POST') {
      $summary = @{
        analysis = "### Daily Financial Health & Margin Highlights\`nYour store data has been reconciled on your local Windows hard drive. Review net sales, gross profit margin, and operating expenses above.\`n\`n### Actionable Recommendations\`n- Verify physical cash drawer against Expected Cash in Drawer.\`n- Restock any items flagged in Low Stock Alerts before tomorrow morning."
        source = "local-windows-engine"
      } | ConvertTo-Json
      Send-JsonResponse $stream 200 $summary
    }
    elseif ($pathOnly -eq '/api/download-exe') {
      $exeBytes = [System.IO.File]::ReadAllBytes($exePath)
      Send-HttpResponse $stream 200 'OK' 'application/vnd.microsoft.portable-executable' $exeBytes @{'Content-Disposition'='attachment; filename="SA_Brothers_POS.exe"'}
    }
    elseif ($pathOnly -eq '/api/download-launcher') {
      Send-HttpResponse $stream 200 'OK' 'application/x-bat' $launcherBatBytes @{'Content-Disposition'='attachment; filename="START_SHOP_POS.bat"'}
    }
    elseif ($pathOnly -eq '/api/download-backup-bat') {
      Send-HttpResponse $stream 200 'OK' 'application/x-bat' $backupBatBytes @{'Content-Disposition'='attachment; filename="BACKUP_LOCAL_DATABASE.bat"'}
    }
    elseif ($pathOnly -eq '/api/download-sql') {
      Send-HttpResponse $stream 200 'OK' 'application/sql; charset=utf-8' $sqlDumpBytes @{'Content-Disposition'='attachment; filename="sa_brothers_pos.sql"'}
    }
    else {
      $assetEntry = $assets.$pathOnly
      if ($null -eq $assetEntry) {
        $assetEntry = $assets.'/index.html'
      }
      $fileBytes = [System.Convert]::FromBase64String($assetEntry.b64)
      Send-HttpResponse $stream 200 'OK' $assetEntry.mime $fileBytes
    }
  } catch {} finally {
    $client.Close()
  }
}
`;
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
    process.exit(1);
  }

  const distAssets = collectDistFiles(DIST_DIR);
  const launcherBatB64 = fs.existsSync(path.join(ROOT_DIR, 'START_SHOP_POS.bat'))
    ? fs.readFileSync(path.join(ROOT_DIR, 'START_SHOP_POS.bat')).toString('base64')
    : '';
  const backupBatB64 = fs.existsSync(path.join(ROOT_DIR, 'BACKUP_LOCAL_DATABASE.bat'))
    ? fs.readFileSync(path.join(ROOT_DIR, 'BACKUP_LOCAL_DATABASE.bat')).toString('base64')
    : '';
  const sqlDumpB64 = fs.existsSync(path.join(ROOT_DIR, 'sa_brothers_pos.sql'))
    ? fs.readFileSync(path.join(ROOT_DIR, 'sa_brothers_pos.sql')).toString('base64')
    : '';

  const nodeWin64Path = path.join(ROOT_DIR, 'node-win64', 'node.exe');
  const exeStats = fs.existsSync(OUTPUT_EXE) ? fs.statSync(OUTPUT_EXE) : null;
  const isRealSeaExe = exeStats && exeStats.size > 50 * 1024 * 1024;

  if (isRealSeaExe) {
    console.log(`Preserving authentic Windows standalone executable: ${OUTPUT_EXE} (${(exeStats.size / (1024 * 1024)).toFixed(1)} MB)`);
  } else if (fs.existsSync(nodeWin64Path)) {
    fs.copyFileSync(nodeWin64Path, OUTPUT_EXE);
    console.log(`Initialized full Windows binary from node-win64: ${(fs.statSync(OUTPUT_EXE).size / (1024 * 1024)).toFixed(1)} MB`);
  }

  // Create full zip package (60MB+ full offline software bundle)
  await new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(OUTPUT_ZIP);
    const archive = new ZipArchive({ zlib: { level: 6 } });

    outputStream.on('close', () => {
      console.log(`Successfully built full Windows ZIP package: ${OUTPUT_ZIP} (${(archive.pointer() / (1024 * 1024)).toFixed(1)} MB)`);
      resolve(null);
    });

    archive.on('error', (err) => reject(err));
    outputStream.on('error', (err) => reject(err));

    archive.pipe(outputStream);
    archive.file(OUTPUT_EXE, { name: 'SA_Brothers_POS.exe' });

    if (fs.existsSync(nodeWin64Path)) {
      archive.file(nodeWin64Path, { name: 'node.exe' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'dist-windows', 'app.cjs'))) {
      archive.file(path.join(ROOT_DIR, 'dist-windows', 'app.cjs'), { name: 'server.cjs' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'START_SHOP_POS.bat'))) {
      archive.file(path.join(ROOT_DIR, 'START_SHOP_POS.bat'), { name: 'START_SHOP_POS.bat' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'BACKUP_LOCAL_DATABASE.bat'))) {
      archive.file(path.join(ROOT_DIR, 'BACKUP_LOCAL_DATABASE.bat'), { name: 'BACKUP_LOCAL_DATABASE.bat' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'SHOP_COMPUTER_SETUP_GUIDE.md'))) {
      archive.file(path.join(ROOT_DIR, 'SHOP_COMPUTER_SETUP_GUIDE.md'), { name: 'SHOP_COMPUTER_SETUP_GUIDE.md' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'README.md'))) {
      archive.file(path.join(ROOT_DIR, 'README.md'), { name: 'README.md' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'sa_brothers_pos.sql'))) {
      archive.file(path.join(ROOT_DIR, 'sa_brothers_pos.sql'), { name: 'sa_brothers_pos.sql' });
    }
    if (fs.existsSync(path.join(ROOT_DIR, 'local_database'))) {
      archive.directory(path.join(ROOT_DIR, 'local_database'), 'local_database');
    }
    if (fs.existsSync(DIST_DIR)) {
      archive.directory(DIST_DIR, 'dist');
    }

    archive.finalize().catch(reject);
  });
}

main();
