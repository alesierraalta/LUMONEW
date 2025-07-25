# ===============================================
# Kill All Node.js Processes - Windows Script
# ===============================================

Write-Host "Searching for Node.js processes..." -ForegroundColor Yellow

# Get all Node.js related processes
$nodeProcesses = Get-Process | Where-Object {
    $_.ProcessName -eq "node" -or 
    $_.ProcessName -eq "nodejs" -or
    $_.ProcessName -eq "npm" -or
    $_.ProcessName -eq "npx" -or
    $_.ProcessName -eq "yarn" -or
    $_.ProcessName -eq "pnpm" -or
    $_.Name -like "*node*"
}

if ($nodeProcesses.Count -eq 0) {
    Write-Host "No Node.js processes found running." -ForegroundColor Green
    Write-Host ""
    Write-Host "Checking for processes using common development ports..."
    
    # Check common development ports
    $commonPorts = @(3000, 3001, 3002, 4000, 5000, 8000, 8080, 8081, 9000)
    
    foreach ($port in $commonPorts) {
        $connections = netstat -ano | Select-String ":$port\s"
        if ($connections) {
            Write-Host "Port $port is in use:" -ForegroundColor Yellow
            $connections | ForEach-Object {
                $line = $_.Line.Trim()
                if ($line -match "LISTENING\s+(\d+)$") {
                    $pid = $matches[1]
                    try {
                        $process = Get-Process -Id $pid -ErrorAction Stop
                        Write-Host "   Process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Cyan
                    } catch {
                        Write-Host "   PID: $pid (process details unavailable)" -ForegroundColor Gray
                    }
                }
            }
        }
    }
} else {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es):" -ForegroundColor Red
    
    foreach ($process in $nodeProcesses) {
        Write-Host "   - $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Cyan
        
        # Try to get the command line to show what's running
        try {
            $commandLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            if ($commandLine) {
                $shortCommand = if ($commandLine.Length -gt 80) { 
                    $commandLine.Substring(0, 77) + "..." 
                } else { 
                    $commandLine 
                }
                Write-Host "     Command: $shortCommand" -ForegroundColor Gray
            }
        } catch {
            # Ignore errors getting command line
        }
    }
    
    Write-Host ""
    $confirmation = Read-Host "Do you want to kill all these processes? (y/N)"
    
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y' -or $confirmation -eq 'yes') {
        Write-Host ""
        Write-Host "Killing Node.js processes..." -ForegroundColor Red
        
        foreach ($process in $nodeProcesses) {
            try {
                Stop-Process -Id $process.Id -Force -ErrorAction Stop
                Write-Host "   Killed $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Green
            } catch {
                Write-Host "   Failed to kill $($process.ProcessName) (PID: $($process.Id)): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Process cleanup completed!" -ForegroundColor Green
        
        # Wait a moment and check again
        Start-Sleep -Seconds 2
        $remainingProcesses = Get-Process | Where-Object {
            $_.ProcessName -eq "node" -or 
            $_.ProcessName -eq "nodejs" -or
            $_.ProcessName -eq "npm" -or
            $_.ProcessName -eq "npx" -or
            $_.ProcessName -eq "yarn" -or
            $_.ProcessName -eq "pnpm" -or
            $_.Name -like "*node*"
        }
        
        if ($remainingProcesses.Count -gt 0) {
            Write-Host "Warning: $($remainingProcesses.Count) Node.js process(es) still running:" -ForegroundColor Yellow
            foreach ($process in $remainingProcesses) {
                Write-Host "   - $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
            }
        } else {
            Write-Host "All Node.js processes have been successfully terminated." -ForegroundColor Green
        }
        
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "To use this script:"
Write-Host "   PowerShell: .\kill-node-processes.ps1"
Write-Host "   Or run: powershell -ExecutionPolicy Bypass -File kill-node-processes.ps1"
Write-Host ""
Write-Host "Alternative manual commands:"
Write-Host "   Kill all node: taskkill /f /im node.exe"
Write-Host "   Kill all npm:  taskkill /f /im npm.cmd"
Write-Host "   Kill by port:  netstat -ano | findstr :3000"
Write-Host "                  taskkill /f /pid <PID_NUMBER>" 