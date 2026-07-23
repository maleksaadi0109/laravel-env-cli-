#!/usr/bin/env bash
# Script to automate Docker permission setup for current user and socket

echo "🔧 Setting up Docker permissions..."

# 1. Fix socket permission immediately
if [ "$EUID" -ne 0 ]; then
  echo "Granting read/write access to /var/run/docker.sock..."
  sudo chmod 666 /var/run/docker.sock
  sudo usermod -aG docker $USER
else
  chmod 666 /var/run/docker.sock
fi

echo "✅ Docker socket permissions granted (chmod 666 /var/run/docker.sock)."
echo "✅ User added to docker group."
echo "🎉 Setup complete! You can now run lenv commands without permission errors."
