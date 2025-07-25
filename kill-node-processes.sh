#!/bin/bash

# ===============================================
# 🔥 Kill All Node.js Processes - Unix/Linux/macOS Script
# ===============================================

echo "🔍 Searching for Node.js processes..."

# Find all Node.js related processes
NODE_PIDS=$(pgrep -f "node|npm|npx|yarn|pnpm" 2>/dev/null)

if [ -z "$NODE_PIDS" ]; then
    echo "✅ No Node.js processes found running."
    echo ""
    echo "🔍 Checking for processes using common development ports..."
    
    # Check common development ports
    COMMON_PORTS=(3000 3001 3002 4000 5000 8000 8080 8081 9000)
    
    for port in "${COMMON_PORTS[@]}"; do
        if command -v lsof > /dev/null 2>&1; then
            # Use lsof if available (macOS/Linux)
            PROCESS_INFO=$(lsof -ti:$port 2>/dev/null)
            if [ ! -z "$PROCESS_INFO" ]; then
                echo "⚠️  Port $port is in use:"
                lsof -i:$port 2>/dev/null | while read line; do
                    if [[ $line != COMMAND* ]]; then
                        echo "   $line"
                    fi
                done
            fi
        elif command -v netstat > /dev/null 2>&1; then
            # Use netstat as fallback
            PROCESS_INFO=$(netstat -tlnp 2>/dev/null | grep ":$port ")
            if [ ! -z "$PROCESS_INFO" ]; then
                echo "⚠️  Port $port is in use:"
                echo "   $PROCESS_INFO"
            fi
        fi
    done
else
    echo "🎯 Found Node.js processes:"
    echo ""
    
    # Show detailed process information
    echo "PID    COMMAND"
    echo "---    -------"
    for pid in $NODE_PIDS; do
        if ps -p $pid > /dev/null 2>&1; then
            COMMAND=$(ps -p $pid -o comm= 2>/dev/null)
            FULL_COMMAND=$(ps -p $pid -o args= 2>/dev/null)
            
            # Truncate long commands
            if [ ${#FULL_COMMAND} -gt 80 ]; then
                DISPLAY_COMMAND="${FULL_COMMAND:0:77}..."
            else
                DISPLAY_COMMAND="$FULL_COMMAND"
            fi
            
            echo "$pid    $DISPLAY_COMMAND"
        fi
    done
    
    echo ""
    read -p "❓ Do you want to kill all these processes? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "💀 Killing Node.js processes..."
        
        KILLED_COUNT=0
        FAILED_COUNT=0
        
        for pid in $NODE_PIDS; do
            if ps -p $pid > /dev/null 2>&1; then
                COMMAND=$(ps -p $pid -o comm= 2>/dev/null)
                if kill -TERM $pid 2>/dev/null; then
                    echo "   ✅ Killed $COMMAND (PID: $pid)"
                    ((KILLED_COUNT++))
                    
                    # Wait a moment for graceful shutdown
                    sleep 1
                    
                    # Force kill if still running
                    if ps -p $pid > /dev/null 2>&1; then
                        if kill -KILL $pid 2>/dev/null; then
                            echo "   🔥 Force killed $COMMAND (PID: $pid)"
                        else
                            echo "   ❌ Failed to kill $COMMAND (PID: $pid)"
                            ((FAILED_COUNT++))
                        fi
                    fi
                else
                    echo "   ❌ Failed to kill $COMMAND (PID: $pid)"
                    ((FAILED_COUNT++))
                fi
            fi
        done
        
        echo ""
        echo "🎉 Process cleanup completed!"
        echo "   ✅ Killed: $KILLED_COUNT processes"
        if [ $FAILED_COUNT -gt 0 ]; then
            echo "   ❌ Failed: $FAILED_COUNT processes"
        fi
        
        # Wait a moment and check again
        sleep 2
        REMAINING_PIDS=$(pgrep -f "node|npm|npx|yarn|pnpm" 2>/dev/null)
        
        if [ ! -z "$REMAINING_PIDS" ]; then
            echo ""
            echo "⚠️  Warning: Some Node.js processes are still running:"
            for pid in $REMAINING_PIDS; do
                if ps -p $pid > /dev/null 2>&1; then
                    COMMAND=$(ps -p $pid -o comm= 2>/dev/null)
                    echo "   - $COMMAND (PID: $pid)"
                fi
            done
        else
            echo ""
            echo "✅ All Node.js processes have been successfully terminated."
        fi
        
    else
        echo "❌ Operation cancelled."
    fi
fi

echo ""
echo "📋 To use this script:"
echo "   Make executable: chmod +x kill-node-processes.sh"
echo "   Run: ./kill-node-processes.sh"
echo ""
echo "🔧 Alternative manual commands:"
echo "   Kill all node: pkill -f node"
echo "   Kill all npm:  pkill -f npm"
echo "   Kill by port:  lsof -ti:3000 | xargs kill -9"
echo "   List by port:  lsof -i:3000"

# Kill processes by port function
kill_by_port() {
    local port=$1
    if [ -z "$port" ]; then
        echo "Usage: kill_by_port <port_number>"
        return 1
    fi
    
    if command -v lsof > /dev/null 2>&1; then
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            echo "Killing processes on port $port..."
            echo "$pids" | xargs kill -9
            echo "Done."
        else
            echo "No processes found on port $port"
        fi
    else
        echo "lsof command not available. Please install it or use manual methods."
    fi
}

# Export the function for use
export -f kill_by_port 2>/dev/null || true 