<?php
declare(strict_types=1);

// Application-owned session files survive the host's short shared-session GC.
// Every file has a PHP guard, including on hosts without Apache .htaccess.
final class BeatsSessionStore implements
    SessionHandlerInterface,
    SessionUpdateTimestampHandlerInterface
{
    private const GUARD = "<?php http_response_code(404); exit; __halt_compiler();\n";
    private $handle = null;
    public function __construct(
        private string $directory,
        private int $lifetime,
    ) {}
    private function file(string $id): string
    {
        if (!preg_match('/^[a-zA-Z0-9,-]{16,128}$/D', $id)) {
            throw new RuntimeException("Invalid session ID");
        }
        return $this->directory . "/" . $id . ".session.php";
    }
    public function open(string $path, string $name): bool
    {
        return true;
    }
    public function close(): bool
    {
        if (is_resource($this->handle)) {
            flock($this->handle, LOCK_UN);
            fclose($this->handle);
        }
        $this->handle = null;
        return true;
    }
    public function read(string $id): string|false
    {
        $this->close();
        $this->handle = fopen($this->file($id), "c+b");
        if (!$this->handle || !flock($this->handle, LOCK_EX)) {
            return false;
        }
        @chmod($this->file($id), 0600);
        $raw = stream_get_contents($this->handle);
        return str_starts_with($raw, self::GUARD)
            ? substr($raw, strlen(self::GUARD))
            : "";
    }
    public function write(string $id, string $data): bool
    {
        if (!is_resource($this->handle) && $this->read($id) === false) {
            return false;
        }
        rewind($this->handle);
        if (!ftruncate($this->handle, 0)) {
            return false;
        }
        $payload = self::GUARD . $data;
        $written = fwrite($this->handle, $payload);
        return $written === strlen($payload) && fflush($this->handle);
    }
    public function destroy(string $id): bool
    {
        $this->close();
        $file = $this->file($id);
        return !is_file($file) || unlink($file);
    }
    public function gc(int $max_lifetime): int|false
    {
        $removed = 0;
        foreach (glob($this->directory . "/*.session.php") ?: [] as $file) {
            if (filemtime($file) >= time() - $this->lifetime) {
                continue;
            }
            $handle = @fopen($file, "r+b");
            if (!$handle) {
                continue;
            }
            if (flock($handle, LOCK_EX | LOCK_NB)) {
                // Truncate under the lock; unlink after close also works on Windows.
                ftruncate($handle, 0);
                flock($handle, LOCK_UN);
                fclose($handle);
                if (@unlink($file)) {
                    $removed++;
                }
            } else {
                fclose($handle);
            }
        }
        return $removed;
    }
    public function validateId(string $id): bool
    {
        if (!preg_match('/^[a-zA-Z0-9,-]{16,128}$/D', $id)) {
            return false;
        }
        $file = $this->file($id);
        return is_file($file) && filemtime($file) >= time() - $this->lifetime;
    }
    public function updateTimestamp(string $id, string $data): bool
    {
        return touch($this->file($id));
    }
}
