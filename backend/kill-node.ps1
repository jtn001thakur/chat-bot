# PowerShell script to comprehensively kill Node.js processes

# Function to kill processes by port
function Kill-PortProcesses {
    param (
        [int]$Port = 3000
    )

    # Method 1: Find and kill processes using the specific port
    $portProcesses = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess | 
        ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue }

    if ($portProcesses) {
        Write-Host "Killing processes using port $Port"
        $portProcesses | Stop-Process -Force
    }

    # Method 2: Kill Node.js processes
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | 
        Where-Object { $_.Modules | Where-Object { $_.ModuleName -like "*node.exe*" } }

    if ($nodeProcesses) {
        Write-Host "Killing Node.js processes"
        $nodeProcesses | Stop-Process -Force
    }

    # Method 3: Kill Nodemon processes
    $nodemonProcesses = Get-Process nodemon -ErrorAction SilentlyContinue
    if ($nodemonProcesses) {
        Write-Host "Killing Nodemon processes"
        $nodemonProcesses | Stop-Process -Force
    }

    # Method 4: Kill processes using netstat (fallback method)
    $netstatProcesses = netstat -ano | 
        Select-String ":$Port" | 
        ForEach-Object { 
            $line = $_.Line.Trim() -split '\s+' 
            $pid = $line[-1]
            try { 
                Get-Process -Id $pid -ErrorAction Stop 
            } catch { 
                $null 
            }
        }

    if ($netstatProcesses) {
        Write-Host "Killing additional processes found by netstat"
        $netstatProcesses | Stop-Process -Force
    }

    # Final check and reporting
    $remainingProcesses = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($remainingProcesses) {
        Write-Warning "Some processes on port $Port could not be terminated"
    } else {
        Write-Host "Successfully cleared port $Port"
    }
}

# Execute the function
Kill-PortProcesses
