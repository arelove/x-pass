# Список флагов
$flags = @("gb", "ru", "cn", "es", "br", "fr", "de", "jp", "kr", "it", "sa", "in", "id")

# Скачиваем каждый флаг
foreach ($flag in $flags) {
    Write-Host "Downloading $flag flag..."
    $url = "https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/$flag.svg"
    $output = "src-tauri\assets\flags\$flag.svg"
    Invoke-WebRequest -Uri $url -OutFile $output
}

Write-Host "All flags downloaded successfully!"