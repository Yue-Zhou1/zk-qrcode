#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTROLLERS_DIR="$ROOT_DIR/controllers"

cd "$ROOT_DIR"

echo "[1/5] Checking required tools..."
if ! command -v circom >/dev/null 2>&1; then
  echo "Error: circom is required but not found in PATH."
  echo "Install circom first: https://docs.circom.io/getting-started/installation/"
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required but not found in PATH."
  exit 1
fi

PTAU_0000="$CONTROLLERS_DIR/pot14_0000.ptau"
PTAU_0001="$CONTROLLERS_DIR/pot14_0001.ptau"
PTAU_FINAL="$CONTROLLERS_DIR/pot14_final.ptau"

if [[ ! -f "$PTAU_FINAL" ]]; then
  echo "[2/5] Creating powers of tau artifacts..."
  npx snarkjs powersoftau new bn128 14 "$PTAU_0000" -v
  npx snarkjs powersoftau contribute "$PTAU_0000" "$PTAU_0001" --name="local-contribution" -v -e="zk-qrcode-local"
  npx snarkjs powersoftau prepare phase2 "$PTAU_0001" "$PTAU_FINAL" -v
else
  echo "[2/5] Using existing $PTAU_FINAL"
fi

echo "[3/5] Compiling circuit..."
circom "$CONTROLLERS_DIR/circuit.circom" --r1cs --wasm --sym -o "$CONTROLLERS_DIR"

echo "[4/5] Running PLONK setup..."
npx snarkjs plonk setup "$CONTROLLERS_DIR/circuit.r1cs" "$PTAU_FINAL" "$CONTROLLERS_DIR/circuit_final.zkey"

echo "[5/5] Exporting verification key..."
npx snarkjs zkey export verificationkey "$CONTROLLERS_DIR/circuit_final.zkey" "$CONTROLLERS_DIR/verification_key.json"

echo "Done. Runtime artifacts generated:"
echo "- controllers/circuit.wasm"
echo "- controllers/circuit_final.zkey"
echo "- controllers/verification_key.json"
