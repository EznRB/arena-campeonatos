$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath 'node_modules/expo/bin/cli')) {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível instalar as dependências.' }
}
$major = [int]((& node -p 'process.versions.node.split(".")[0]'))
if ($major -eq 22 -or $major -eq 24 -or $major -ge 26) {
    npx expo start @args
} else {
    Write-Host 'Usando Node 24 para compatibilidade com o Expo SDK 58.'
    npm exec --yes --package=node@24 -- node node_modules/expo/bin/cli start @args
}
exit $LASTEXITCODE
