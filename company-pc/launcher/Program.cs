using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO.Compression;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using ExcelDataReader;
using Microsoft.Web.WebView2.Core;

internal static class Program
{
    const int WS_OVERLAPPED = 0x00000000;
    const int WS_CAPTION = 0x00C00000;
    const int WS_SYSMENU = 0x00080000;
    const int WS_VISIBLE = 0x10000000;
    const int WS_CHILD = 0x40000000;
    const int WS_TABSTOP = 0x00010000;
    const int WM_COMMAND = 0x0111;
    const int WM_DESTROY = 0x0002;
    const int WM_CLOSE = 0x0010;
    const int WM_SETFONT = 0x0030;
    const int WM_SIZE = 0x0005;
    const int WM_SYNC = 0x8001;
    const int OFN_FILEMUSTEXIST = 0x00001000;
    const int OFN_PATHMUSTEXIST = 0x00000800;
    const int OFN_EXPLORER = 0x00080000;
    const int OFN_ALLOWMULTISELECT = 0x00000200;
    const int OFN_OVERWRITEPROMPT = 0x00000002;
    const int WS_CLIPCHILDREN = 0x02000000;
    const int WM_ERASEBKGND = 0x0014;
    const int WM_PAINT = 0x000F;
    const int STATIC_STYLE = WS_CHILD | WS_VISIBLE | 0x0080;
    const int BUTTON_STYLE = WS_CHILD | WS_VISIBLE | WS_TABSTOP;
    const uint PAGE = 0x00F7F2F2;
    const uint CARD = 0x00FFFFFF;
    const uint INK = 0x001E1C1C;
    const uint MUTED = 0x00938E8E;
    const uint LINE = 0x00EAE5E5;
    const uint DT_SINGLE = 0x0020;
    const uint DT_VCENTER = 0x0004;
    const uint DT_END_ELLIPSIS = 0x8000;
    const uint DT_NOPREFIX = 0x0800;
    const uint DT_LINE = DT_SINGLE | DT_VCENTER | DT_END_ELLIPSIS | DT_NOPREFIX;

    static readonly string[] Titles = ["1. 작업 엑셀", "2. 1센터 배치표", "3. 2센터 배치표", "4. 3센터 배치표"];
    static readonly string[] Roles = ["work", "1센터", "2센터", "3센터"];
    static readonly string[] Paths = ["", "", "", "", "", "", "", ""];
    static readonly string[] SlotRole = ["", "", "", "", "", "", "", ""];
    static readonly IntPtr[] PickLabels = new IntPtr[4];
    static readonly IntPtr[] NameLabels = new IntPtr[4];
    static readonly string[] MergeTitles = ["1센터", "2센터", "3센터", "4센터", "5센터", "6센터", "7센터", "8센터"];
    static readonly string[] MergePaths = ["", "", "", "", "", "", "", ""];
    static readonly IntPtr[] MergeRowLabels = new IntPtr[3];
    static readonly IntPtr[] MergeLabels = new IntPtr[3];
    static readonly List<SessionFile> Session = [];
    static string _paceHand = "";
    static readonly Native.WndProcDelegate Proc = WndProc;
    static IntPtr _window;
    static IntPtr _app;
    static IntPtr _viewHost;
    static CoreWebView2Controller? _controller;
    static CoreWebView2? _web;
    static SynchronizationContext? _ui;
    static readonly IntPtr[] PickButtons = new IntPtr[4];
    static readonly IntPtr[] MergeButtons = new IntPtr[3];
    static IntPtr _merge;
    static IntPtr _pickHint;
    static IntPtr _mergeHint;
    static IntPtr _mergeStatus;
    static IntPtr _openButton;
    static IntPtr _makeButton;
    static string _panelDir = "";
    static string _seenPanel = "";
    static bool _panelWarned;
    static System.Threading.Timer? _panelTimer;

    [STAThread]
    static int Main(string[] args)
    {
        if (ApplyPendingSwap(args)) return 0;
        ReadPanelDirArg();
        if (RelaunchLocalCopy()) return 0;
        try
        {
            var running = Environment.ProcessPath ?? "";
            var localDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
            if (running.StartsWith(localDir, StringComparison.OrdinalIgnoreCase)) RemoveOldRunCopies(localDir, running);
        }
        catch { }
        try { RemoveOldHostPages(HostDir(), ""); } catch { }
        try { RemoveOldEdgePages(""); } catch { }
        try { ClearStaleFiles(); } catch { }
        try { if (TryAutoUpdate()) return 0; } catch { }
        try { TryUpdateHtml(); } catch { }
        try
        {
            var staged = Path.Combine(Path.GetDirectoryName(Environment.ProcessPath ?? "") ?? "", "생산성보기.다음.exe");
            if (File.Exists(staged)) File.Delete(staged);
        }
        catch { }
        SeedSharedPanel();
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var instance = Native.GetModuleHandleW(null);
        var cls = new Native.WNDCLASSW
        {
            lpfnWndProc = Proc,
            hInstance = instance,
            lpszClassName = "CenterProductivity",
            hbrBackground = (IntPtr)6,
            hCursor = Native.LoadCursorW(IntPtr.Zero, (IntPtr)32512),
        };
        Native.RegisterClassW(ref cls);
        _app = Native.CreateWindowExW(0, "CenterProductivity", "센터 생산성  Build : " + BuildStamp.Label,
            0x00CF0000 | WS_VISIBLE,
            80, 40, 1280, 860, IntPtr.Zero, IntPtr.Zero, instance, IntPtr.Zero);
        _viewHost = Native.CreateWindowExW(0, "static", "", WS_CHILD | WS_VISIBLE, 0, 0, 1200, 800, _app, IntPtr.Zero, instance, IntPtr.Zero);
        var font = Native.CreateFontW(-18, 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 0, 0, "Malgun Gothic");
        if (font == IntPtr.Zero) font = Native.GetStockObject(17);
        _window = Native.CreateWindowExW(0, "CenterProductivity", "파일 선택",
            WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU,
            140, 80, 680, 520, _app, IntPtr.Zero, instance, IntPtr.Zero);
        _pickHint = Native.CreateWindowExW(0, "Static", "1번은 업로드용 작업 엑셀. 2·3·4번은 배치표입니다.",
            STATIC_STYLE, 24, 16, 600, 28, _window, IntPtr.Zero, instance, IntPtr.Zero);
        Native.SendMessageW(_pickHint, WM_SETFONT, font, (IntPtr)1);
        for (var i = 0; i < Titles.Length; i++)
        {
            PickLabels[i] = Native.CreateWindowExW(0, "Static", Titles[i], STATIC_STYLE, 24, 56, 180, 32, _window, IntPtr.Zero, instance, IntPtr.Zero);
            NameLabels[i] = Native.CreateWindowExW(0, "Static", "아직 없음", STATIC_STYLE, 210, 56, 280, 32, _window, IntPtr.Zero, instance, IntPtr.Zero);
            PickButtons[i] = Native.CreateWindowExW(0, "Button", "찾기", BUTTON_STYLE, 520, 52, 110, 36, _window, (IntPtr)(1001 + i), instance, IntPtr.Zero);
            Native.SendMessageW(PickLabels[i], WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(NameLabels[i], WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(PickButtons[i], WM_SETFONT, font, (IntPtr)1);
        }
        _openButton = Native.CreateWindowExW(0, "Button", "열기", BUTTON_STYLE, 24, 340, 600, 42, _window, (IntPtr)1005, instance, IntPtr.Zero);
        Native.SendMessageW(_openButton, WM_SETFONT, font, (IntPtr)1);
        _merge = Native.CreateWindowExW(0, "CenterProductivity", "센터 파일 합치기",
            WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU,
            160, 100, 680, 460, _app, IntPtr.Zero, instance, IntPtr.Zero);
        _mergeHint = Native.CreateWindowExW(0, "Static", "폴더가 달라도 센터마다 찾기를 누르세요. OrderDetail 시트를 한 엑셀로 합칩니다.",
            STATIC_STYLE, 24, 16, 600, 28, _merge, IntPtr.Zero, instance, IntPtr.Zero);
        Native.SendMessageW(_mergeHint, WM_SETFONT, font, (IntPtr)1);
        for (var i = 0; i < 3; i++)
        {
            MergeRowLabels[i] = Native.CreateWindowExW(0, "Static", $"{i + 1}. {MergeTitles[i]}", STATIC_STYLE, 24, 56, 140, 32, _merge, IntPtr.Zero, instance, IntPtr.Zero);
            MergeLabels[i] = Native.CreateWindowExW(0, "Static", "아직 없음", STATIC_STYLE, 170, 56, 320, 32, _merge, IntPtr.Zero, instance, IntPtr.Zero);
            MergeButtons[i] = Native.CreateWindowExW(0, "Button", "찾기", BUTTON_STYLE, 520, 52, 110, 36, _merge, (IntPtr)(3001 + i), instance, IntPtr.Zero);
            Native.SendMessageW(MergeRowLabels[i], WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(MergeLabels[i], WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(MergeButtons[i], WM_SETFONT, font, (IntPtr)1);
        }
        _makeButton = Native.CreateWindowExW(0, "Button", "업로드용 엑셀 만들기", BUTTON_STYLE, 24, 280, 600, 42, _merge, (IntPtr)3005, instance, IntPtr.Zero);
        Native.SendMessageW(_makeButton, WM_SETFONT, font, (IntPtr)1);
        _mergeStatus = Native.CreateWindowExW(0, "Static", "없는 센터는 비워 두면 그 시트는 만들지 않습니다.",
            STATIC_STYLE, 24, 332, 600, 28, _merge, IntPtr.Zero, instance, IntPtr.Zero);
        Native.SendMessageW(_mergeStatus, WM_SETFONT, font, (IntPtr)1);
        TintCaption(_window);
        TintCaption(_merge);
        SynchronizationContext.SetSynchronizationContext(new StaSync(_app));
        _ui = SynchronizationContext.Current;
        _ = InitWeb();
        Native.ShowWindow(_app, 5);
        Native.UpdateWindow(_app);
        while (Native.GetMessageW(out var msg, IntPtr.Zero, 0, 0) > 0)
        {
            try
            {
                Native.TranslateMessage(ref msg);
                Native.DispatchMessageW(ref msg);
            }
            catch (Exception ex)
            {
                Native.MessageBoxW(_app, ex.Message, "센터 생산성", 0);
            }
        }
        return 0;
    }

    static bool RelaunchLocalCopy()
    {
        var exe = Environment.ProcessPath;
        if (string.IsNullOrEmpty(exe) || !IsRemote(exe)) return false;
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        Directory.CreateDirectory(dir);
        var info = new FileInfo(exe);
        var localExe = Path.Combine(dir, "run-" + info.Length + "-" + info.LastWriteTimeUtc.Ticks + ".exe");
        var sourceDir = Path.GetDirectoryName(exe) ?? "";
        var sourceHtml = Path.Combine(sourceDir, "화면.html");
        var localHtml = Path.Combine(dir, "화면.html");
        try
        {
            if (!File.Exists(localExe)) File.Copy(exe, localExe, false);
        }
        catch
        {
            return false;
        }
        try { if (File.Exists(sourceHtml)) CopyIfNewer(sourceHtml, localHtml); } catch { }
        try { File.WriteAllText(Path.Combine(dir, "panel-dir.txt"), sourceDir, new UTF8Encoding(false)); } catch { }
        if (!File.Exists(localExe)) return false;
        RemoveOldRunCopies(dir, localExe);
        var start = new ProcessStartInfo(localExe)
        {
            UseShellExecute = true,
            WorkingDirectory = dir,
            Arguments = "--panel-dir=\"" + sourceDir.Replace("\"", "") + "\"",
        };
        Process.Start(start);
        return true;
    }

    static void RemoveOldRunCopies(string dir, string keep)
    {
        string keepFull;
        try { keepFull = Path.GetFullPath(keep); }
        catch { return; }
        string[] files;
        try { files = Directory.GetFiles(dir, "run-*.exe"); }
        catch { return; }
        foreach (var file in files)
        {
            try
            {
                if (string.Equals(Path.GetFullPath(file), keepFull, StringComparison.OrdinalIgnoreCase)) continue;
                File.Delete(file);
            }
            catch { }
        }
    }

    static void RemoveOldHostPages(string dir, string keep)
    {
        var keepFull = "";
        if (keep.Length > 0)
        {
            try { keepFull = Path.GetFullPath(keep); }
            catch { return; }
        }
        string[] files;
        try { files = Directory.GetFiles(dir, "app-*.html"); }
        catch { return; }
        foreach (var file in files)
        {
            try
            {
                if (keepFull.Length > 0 && string.Equals(Path.GetFullPath(file), keepFull, StringComparison.OrdinalIgnoreCase)) continue;
                File.Delete(file);
            }
            catch { }
        }
    }

    static string EdgePageDir() => Path.Combine(Path.GetTempPath(), "center-productivity");

    static void RemoveOldEdgePages(string keep)
    {
        var keepFull = "";
        if (keep.Length > 0)
        {
            try { keepFull = Path.GetFullPath(keep); }
            catch { return; }
        }
        string[] files;
        try { files = Directory.GetFiles(EdgePageDir(), "view-*.html"); }
        catch { return; }
        foreach (var file in files)
        {
            try
            {
                if (keepFull.Length > 0 && string.Equals(Path.GetFullPath(file), keepFull, StringComparison.OrdinalIgnoreCase)) continue;
                File.Delete(file);
            }
            catch { }
        }
    }

    static void ClearStaleFiles()
    {
        TryDeleteDirectory(Path.Combine(Path.GetTempPath(), "center-productivity-wv2"));
        DeleteTempMatches("center-slim-*.xml");
        DeleteTempMatches("center-up-*");
        TrimReadLogs();
        var localDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        DeleteMatches(localDir, "*.new");
    }

    static void DeleteTempMatches(string pattern) => DeleteMatches(Path.GetTempPath(), pattern);

    static void DeleteMatches(string dir, string pattern)
    {
        string[] files;
        try { files = Directory.GetFiles(dir, pattern); }
        catch { return; }
        foreach (var file in files)
        {
            try { File.Delete(file); } catch { }
        }
    }

    static void TrimReadLogs()
    {
        var dir = ReadTraceDir();
        if (!Directory.Exists(dir)) return;
        string[] files;
        try { files = Directory.GetFiles(dir, "verify-*.txt"); }
        catch { return; }
        var newest = "";
        var newestTime = DateTime.MinValue;
        foreach (var file in files)
        {
            if (string.Equals(Path.GetFileName(file), "verify-latest.txt", StringComparison.OrdinalIgnoreCase)) continue;
            DateTime when;
            try { when = File.GetLastWriteTimeUtc(file); }
            catch { continue; }
            if (when >= newestTime)
            {
                newestTime = when;
                newest = file;
            }
        }
        foreach (var file in files)
        {
            if (string.Equals(Path.GetFileName(file), "verify-latest.txt", StringComparison.OrdinalIgnoreCase)) continue;
            if (newest.Length > 0 && string.Equals(file, newest, StringComparison.OrdinalIgnoreCase)) continue;
            try { File.Delete(file); } catch { }
        }
        try
        {
            var log = Path.Combine(dir, "read.log");
            if (File.Exists(log) && new FileInfo(log).Length > 1024 * 1024) File.Delete(log);
        }
        catch { }
    }

    static void TryDeleteDirectory(string dir)
    {
        if (!Directory.Exists(dir)) return;
        try
        {
            Directory.Delete(dir, true);
            return;
        }
        catch { }
        try
        {
            foreach (var file in Directory.EnumerateFiles(dir, "*", SearchOption.AllDirectories))
            {
                try { File.SetAttributes(file, FileAttributes.Normal); File.Delete(file); } catch { }
            }
            foreach (var sub in Directory.EnumerateDirectories(dir, "*", SearchOption.AllDirectories).OrderByDescending(path => path.Length))
            {
                try { Directory.Delete(sub, false); } catch { }
            }
            try { Directory.Delete(dir, false); } catch { }
        }
        catch { }
    }

    static void ReadPanelDirArg()
    {
        foreach (var arg in Environment.GetCommandLineArgs())
        {
            const string prefix = "--panel-dir=";
            if (!arg.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) continue;
            var dir = arg[prefix.Length..].Trim().Trim('"');
            if (dir.Length is > 0 and < 400) _panelDir = dir;
        }
        if (_panelDir.Length > 0) return;
        var exe = Environment.ProcessPath ?? "";
        var note = Path.Combine(Path.GetDirectoryName(exe) ?? "", "panel-dir.txt");
        try
        {
            if (!File.Exists(note)) return;
            var dir = File.ReadAllText(note, Encoding.UTF8).Trim();
            if (dir.Length is > 0 and < 400) _panelDir = dir;
        }
        catch { }
    }

    const string VersionUrl = "https://osan.grok.me/company-version.txt";
    const string HtmlUrl = "https://osan.grok.me/company-html.txt";
    const string ZipUrl = "https://osan.grok.me/company-pc.zip";

    static bool ApplyPendingSwap(string[] args)
    {
        var at = Array.FindIndex(args, arg => arg == "--swap");
        if (at < 0 || at + 1 >= args.Length) return false;
        var dest = args[at + 1].Trim('"');
        var me = Environment.ProcessPath ?? "";
        if (dest.Length == 0 || me.Length == 0) return false;
        for (var i = 0; i < 40; i++)
        {
            try
            {
                File.Copy(me, dest, true);
                break;
            }
            catch
            {
                Thread.Sleep(500);
            }
        }
        try
        {
            var panel = args.FirstOrDefault(arg => arg.StartsWith("--panel-dir=", StringComparison.OrdinalIgnoreCase)) ?? "";
            Process.Start(new ProcessStartInfo(dest)
            {
                UseShellExecute = true,
                WorkingDirectory = Path.GetDirectoryName(dest) ?? "",
                Arguments = panel,
            });
        }
        catch { }
        return true;
    }

    static bool TryAutoUpdate()
    {
        string remote;
        try
        {
            remote = DownloadText(VersionUrl);
        }
        catch
        {
            return false;
        }
        if (remote.Length is < 10 or > 40 || remote == BuildStamp.Value) return false;
        if (remote.Any(ch => !(char.IsDigit(ch) || ch is '-' or ':' or 'T' or 'Z' or '.'))) return false;
        if (RecentlyTried(remote)) return false;
        byte[] zipBytes;
        try
        {
            zipBytes = DownloadBytes(ZipUrl);
        }
        catch
        {
            return false;
        }
        if (!TryReadPack(zipBytes, out var exeBytes, out var htmlBytes))
        {
            return false;
        }
        var share = ShareDir();
        var updated = share.Length > 0 && TryInstallPack(share, exeBytes, htmlBytes, restartShare: true);
        if (!updated)
        {
            var localDir = Path.GetDirectoryName(Environment.ProcessPath ?? "") ?? "";
            updated = localDir.Length > 0 && TryInstallPack(localDir, exeBytes, htmlBytes, restartShare: false);
        }
        if (!updated)
        {
            return false;
        }
        MarkTried(remote);
        return updated;
    }

    static string DownloadText(string url)
    {
        var bytes = DownloadBytes(url);
        return Encoding.UTF8.GetString(bytes).Trim().TrimStart('\uFEFF');
    }

    static byte[] DownloadBytes(string url)
    {
        try
        {
            using var http = new HttpClient(new SocketsHttpHandler { ConnectTimeout = TimeSpan.FromSeconds(8), UseProxy = true })
            {
                Timeout = TimeSpan.FromMinutes(3),
            };
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CenterProductivity");
            return http.GetByteArrayAsync(url + "?t=" + DateTime.UtcNow.Ticks).GetAwaiter().GetResult();
        }
        catch
        {
            return DownloadWithPowerShell(url);
        }
    }

    static byte[] DownloadWithPowerShell(string url)
    {
        var dest = Path.Combine(Path.GetTempPath(), "center-up-" + Guid.NewGuid().ToString("N"));
        var script = Path.Combine(Path.GetTempPath(), "center-up-" + Guid.NewGuid().ToString("N") + ".ps1");
        File.WriteAllText(script, "Invoke-WebRequest -UseBasicParsing -Uri '" + url + "?t=" + DateTime.UtcNow.Ticks + "' -OutFile '" + dest + "'\n", new UTF8Encoding(false));
        try
        {
            using var process = Process.Start(new ProcessStartInfo("powershell.exe", "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"" + script + "\"")
            {
                UseShellExecute = false,
                CreateNoWindow = true,
            });
            if (process == null || !process.WaitForExit(180000) || process.ExitCode != 0 || !File.Exists(dest))
                throw new IOException("download");
            return File.ReadAllBytes(dest);
        }
        finally
        {
            try { File.Delete(script); } catch { }
            try { if (File.Exists(dest)) File.Delete(dest); } catch { }
        }
    }

    static void TryUpdateHtml()
    {
        if (BuildStamp.Html.Length < 8) return;
        string remote;
        try
        {
            remote = DownloadText(HtmlUrl);
        }
        catch
        {
            return;
        }
        if (remote.Length is < 8 or > 64 || remote.Any(ch => !Uri.IsHexDigit(ch))) return;
        if (string.Equals(remote, BuildStamp.Html, StringComparison.OrdinalIgnoreCase)) return;
        var mark = HtmlMarkPath();
        try
        {
            if (File.Exists(mark) && string.Equals(File.ReadAllText(mark).Trim(), remote, StringComparison.OrdinalIgnoreCase)) return;
        }
        catch { }
        byte[] zipBytes;
        try
        {
            zipBytes = DownloadBytes(ZipUrl);
        }
        catch
        {
            return;
        }
        if (!TryReadHtml(zipBytes, out var htmlBytes)) return;
        var wrote = false;
        var localDir = Path.GetDirectoryName(Environment.ProcessPath ?? "") ?? "";
        if (localDir.Length > 0 && TryWriteBytes(Path.Combine(localDir, "화면.html"), htmlBytes)) wrote = true;
        var share = ShareDir();
        if (share.Length > 0)
        {
            var same = localDir.Length > 0 && string.Equals(
                Path.GetFullPath(share).TrimEnd('\\'),
                Path.GetFullPath(localDir).TrimEnd('\\'),
                StringComparison.OrdinalIgnoreCase);
            if (!same && TryWriteBytes(Path.Combine(share, "화면.html"), htmlBytes)) wrote = true;
        }
        if (!wrote) return;
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(mark) ?? "");
            File.WriteAllText(mark, remote, new UTF8Encoding(false));
        }
        catch { }
    }

    static string HtmlMarkPath()
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        return Path.Combine(dir, "html-version.txt");
    }

    static bool TryReadHtml(byte[] zipBytes, out byte[] htmlBytes)
    {
        htmlBytes = [];
        try
        {
            using var stream = new MemoryStream(zipBytes);
            using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
            var html = zip.Entries.FirstOrDefault(entry => entry.Name == "화면.html");
            if (html == null || html.Length < 1000) return false;
            htmlBytes = ReadEntry(html);
            return htmlBytes.Length > 1000;
        }
        catch
        {
            return false;
        }
    }

    static bool TryWriteBytes(string path, byte[] bytes)
    {
        try
        {
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
            var temp = path + ".new";
            File.WriteAllBytes(temp, bytes);
            File.Copy(temp, path, true);
            try { File.Delete(temp); } catch { }
            return true;
        }
        catch
        {
            return false;
        }
    }

    static bool TryReadPack(byte[] zipBytes, out byte[] exeBytes, out byte[] htmlBytes)
    {
        exeBytes = [];
        htmlBytes = [];
        try
        {
            using var stream = new MemoryStream(zipBytes);
            using var zip = new ZipArchive(stream, ZipArchiveMode.Read);
            var exe = zip.Entries.FirstOrDefault(entry => entry.Name == "생산성보기.exe");
            var html = zip.Entries.FirstOrDefault(entry => entry.Name == "화면.html");
            if (exe == null || html == null || exe.Length < 1_000_000 || html.Length < 1000) return false;
            exeBytes = ReadEntry(exe);
            htmlBytes = ReadEntry(html);
            return exeBytes.Length > 1_000_000 && htmlBytes.Length > 1000;
        }
        catch
        {
            return false;
        }
    }

    static byte[] ReadEntry(ZipArchiveEntry entry)
    {
        using var input = entry.Open();
        using var output = new MemoryStream();
        input.CopyTo(output);
        return output.ToArray();
    }

    static bool TryInstallPack(string dir, byte[] exeBytes, byte[] htmlBytes, bool restartShare)
    {
        try
        {
            Directory.CreateDirectory(dir);
            var htmlPath = Path.Combine(dir, "화면.html");
            var exePath = Path.Combine(dir, "생산성보기.exe");
            var htmlTemp = htmlPath + ".new";
            File.WriteAllBytes(htmlTemp, htmlBytes);
            File.Copy(htmlTemp, htmlPath, true);
            try { File.Delete(htmlTemp); } catch { }
            var runningHere = string.Equals(
                Path.GetFullPath(dir).TrimEnd('\\'),
                Path.GetFullPath(Path.GetDirectoryName(Environment.ProcessPath ?? "") ?? "").TrimEnd('\\'),
                StringComparison.OrdinalIgnoreCase);
            if (restartShare && !runningHere)
            {
                var exeTemp = exePath + ".new";
                File.WriteAllBytes(exeTemp, exeBytes);
                File.Copy(exeTemp, exePath, true);
                try { File.Delete(exeTemp); } catch { }
                Process.Start(new ProcessStartInfo(exePath) { UseShellExecute = true, WorkingDirectory = dir });
                return true;
            }
            var next = Path.Combine(dir, "생산성보기.다음.exe");
            File.WriteAllBytes(next, exeBytes);
            var panel = _panelDir.Length > 0 ? " --panel-dir=\"" + _panelDir.Replace("\"", "") + "\"" : "";
            Process.Start(new ProcessStartInfo(next)
            {
                UseShellExecute = true,
                WorkingDirectory = dir,
                Arguments = "--swap \"" + exePath + "\"" + panel,
            });
            return true;
        }
        catch
        {
            return false;
        }
    }

    static string UpdateAttemptPath()
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        Directory.CreateDirectory(dir);
        return Path.Combine(dir, "update-attempt.txt");
    }

    static bool RecentlyTried(string remote)
    {
        try
        {
            var path = UpdateAttemptPath();
            if (!File.Exists(path)) return false;
            if (File.ReadAllText(path).Trim() != remote) return false;
            return DateTime.UtcNow - File.GetLastWriteTimeUtc(path) < TimeSpan.FromMinutes(30);
        }
        catch
        {
            return false;
        }
    }

    static void MarkTried(string remote)
    {
        try { File.WriteAllText(UpdateAttemptPath(), remote, new UTF8Encoding(false)); } catch { }
    }

    static bool IsRemote(string path)
    {
        if (path.StartsWith(@"\\", StringComparison.Ordinal)) return true;
        try
        {
            var root = Path.GetPathRoot(path);
            if (string.IsNullOrEmpty(root)) return false;
            return new DriveInfo(root).DriveType == DriveType.Network;
        }
        catch
        {
            return false;
        }
    }

    static void CopyIfNewer(string source, string dest)
    {
        var incoming = new FileInfo(source);
        if (File.Exists(dest))
        {
            var current = new FileInfo(dest);
            if (current.Length == incoming.Length && current.LastWriteTimeUtc >= incoming.LastWriteTimeUtc.AddSeconds(-2)) return;
        }
        var temp = dest + ".new";
        using (var input = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
        using (var output = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.Read))
            input.CopyTo(output);
        File.Copy(temp, dest, true);
        File.Delete(temp);
        File.SetLastWriteTimeUtc(dest, incoming.LastWriteTimeUtc);
    }

    static void LayoutSheet(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero) return;
        Native.GetClientRect(hwnd, out var client);
        var width = Math.Max(360, client.right);
        var merge = hwnd == _merge;
        var hint = merge ? _mergeHint : _pickHint;
        if (hint != IntPtr.Zero) Native.MoveWindow(hint, 24, 16, width - 48, 28, true);
        var count = merge ? 3 : 4;
        for (var i = 0; i < count; i++)
        {
            var y = 56 + i * 64;
            var title = merge ? MergeRowLabels[i] : PickLabels[i];
            var name = merge ? MergeLabels[i] : NameLabels[i];
            var find = merge ? MergeButtons[i] : PickButtons[i];
            if (title != IntPtr.Zero) Native.MoveWindow(title, 24, y, 190, 32, true);
            if (find != IntPtr.Zero) Native.MoveWindow(find, width - 134, y - 4, 110, 36, true);
            if (name != IntPtr.Zero) Native.MoveWindow(name, 220, y, Math.Max(40, width - 220 - 150), 32, true);
        }
        var actionTop = 56 + count * 64 + 8;
        var action = merge ? _makeButton : _openButton;
        if (action != IntPtr.Zero) Native.MoveWindow(action, 24, actionTop, width - 48, 42, true);
        if (merge && _mergeStatus != IntPtr.Zero) Native.MoveWindow(_mergeStatus, 24, actionTop + 50, width - 48, 28, true);
    }

    static void TintCaption(IntPtr hwnd)
    {
        var caption = 0x00F7F2F2;
        var text = 0x001E1C1C;
        var border = 0x00EAE5E5;
        Native.DwmSetWindowAttribute(hwnd, 35, ref caption, 4);
        Native.DwmSetWindowAttribute(hwnd, 36, ref text, 4);
        Native.DwmSetWindowAttribute(hwnd, 34, ref border, 4);
    }

    static IntPtr WndProc(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam)
    {
        if (message == WM_SYNC)
        {
            var held = GCHandle.FromIntPtr(wParam);
            var work = (Tuple<SendOrPostCallback, object?>)held.Target!;
            held.Free();
            work.Item1(work.Item2);
            return IntPtr.Zero;
        }
        if ((hwnd == _window || hwnd == _merge) && message == WM_SIZE)
        {
            LayoutSheet(hwnd);
            return IntPtr.Zero;
        }
        if (hwnd == _app && message == WM_SIZE)
        {
            FitView();
            return IntPtr.Zero;
        }
        if (message == WM_COMMAND)
        {
            var id = wParam.ToInt32() & 0xFFFF;
            if (id is >= 1001 and <= 1004)
            {
                var index = id - 1001;
                var picked = PickFile(hwnd, Titles[index] + " — 해당 폴더에서 고르세요");
                if (picked.Length > 0)
                {
                    Paths[index] = picked;
                    Native.SetWindowTextW(NameLabels[index], Path.GetFileName(picked));
                }
                return IntPtr.Zero;
            }
            if (id == 1005)
            {
                OpenChosen();
                return IntPtr.Zero;
            }
            if (id is >= 3001 and <= 3003)
            {
                var index = id - 3001;
                var picked = PickFile(hwnd, $"{MergeTitles[index]} 파일을 고르세요");
                if (picked.Length > 0)
                {
                    MergePaths[index] = picked;
                    Native.SetWindowTextW(MergeLabels[index], Path.GetFileName(picked));
                }
                return IntPtr.Zero;
            }
            if (id == 3005)
            {
                MergeIntoArchive();
                return IntPtr.Zero;
            }
        }
        if (message == WM_CLOSE && (hwnd == _window || hwnd == _merge))
        {
            Native.ShowWindow(hwnd, 0);
            return IntPtr.Zero;
        }
        if (message == WM_CLOSE && hwnd == _app)
        {
            _controller?.Close();
            Native.DestroyWindow(_app);
            return IntPtr.Zero;
        }
        if (message == WM_DESTROY && hwnd == _app)
        {
            Native.PostQuitMessage(0);
            return IntPtr.Zero;
        }
        return Native.DefWindowProcW(hwnd, message, wParam, lParam);
    }

    static string SlotLabel(bool merge, int index)
    {
        if (merge)
        {
            if ((uint)index < (uint)MergeTitles.Length && MergeTitles[index].Length > 0) return MergeTitles[index];
            return (index + 1) + "번";
        }
        if ((uint)index < (uint)Titles.Length && Titles[index].Length > 0) return Titles[index];
        if ((uint)index < (uint)SlotRole.Length && SlotRole[index].Length > 0) return SlotRole[index];
        return (index + 1) + "번";
    }

    static void PickSlot(bool merge, int index)
    {
        var title = SlotLabel(merge, index) + " 파일을 고르세요";
        var picked = PickFile(_app, title);
        if (picked.Length == 0 || _web == null) return;
        if (merge) MergePaths[index] = picked;
        else Paths[index] = picked;
        _web.PostWebMessageAsString($"{{\"type\":\"slot\",\"kind\":\"{(merge ? "merge" : "work")}\",\"index\":{index},\"name\":{Json(Path.GetFileName(picked))}}}");
    }

    static string PickFile(IntPtr owner, string title)
    {
        var buffer = Marshal.AllocHGlobal(520 * 2);
        try
        {
            for (var i = 0; i < 520 * 2; i++) Marshal.WriteByte(buffer, i, 0);
            var ofn = new Native.OPENFILENAMEW
            {
                hwndOwner = owner,
                lpstrFilter = "Excel\0*.xlsx;*.xlsm;*.xls\0\0",
                lpstrFile = buffer,
                nMaxFile = 520,
                lpstrTitle = title,
                Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_EXPLORER,
            };
            ofn.lStructSize = Marshal.SizeOf<Native.OPENFILENAMEW>();
            if (!Native.GetOpenFileNameW(ref ofn)) return "";
            return Marshal.PtrToStringUni(buffer) ?? "";
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    static string? LoadHtml()
    {
        var exeDir = Path.GetDirectoryName(Environment.ProcessPath ?? "");
        if (!string.IsNullOrEmpty(exeDir))
        {
            var sidecar = Path.Combine(exeDir, "화면.html");
            if (File.Exists(sidecar)) return File.ReadAllText(sidecar, Encoding.UTF8);
        }
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("center.html");
        if (stream == null) return null;
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }

    static string[] PickMany(IntPtr owner, string title)
    {
        const int chars = 32768;
        var buffer = Marshal.AllocHGlobal(chars * 2);
        try
        {
            for (var i = 0; i < chars * 2; i++) Marshal.WriteByte(buffer, i, 0);
            var ofn = new Native.OPENFILENAMEW
            {
                hwndOwner = owner,
                lpstrFilter = "Excel\0*.xlsx;*.xlsm;*.xls\0\0",
                lpstrFile = buffer,
                nMaxFile = chars,
                lpstrTitle = title,
                Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_EXPLORER | OFN_ALLOWMULTISELECT,
            };
            ofn.lStructSize = Marshal.SizeOf<Native.OPENFILENAMEW>();
            if (!Native.GetOpenFileNameW(ref ofn)) return [];
            var parts = new List<string>();
            var offset = 0;
            while (offset < chars)
            {
                var text = Marshal.PtrToStringUni(buffer + offset * 2);
                if (string.IsNullOrEmpty(text)) break;
                parts.Add(text);
                offset += text.Length + 1;
            }
            if (parts.Count <= 1) return parts.ToArray();
            var dir = parts[0];
            return parts.Skip(1).Select(name => Path.Combine(dir, name)).ToArray();
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    static void OpenLedger()
    {
        var files = PickMany(_app != IntPtr.Zero ? _app : _window, "출고 분석 — 미출·오출 엑셀을 고르세요");
        if (files.Length == 0 || _web == null) return;
        SendFiles("ledger", "", files);
    }

    static void OpenOshipUpload()
    {
        var files = PickMany(_app != IntPtr.Zero ? _app : _window, "오출 확인 — 작업·오출 엑셀을 고르세요");
        if (files.Length == 0 || _web == null) return;
        SendFiles("oship-check", "", files);
    }

    static void OpenOshipCheck(bool many)
    {
        var title = many
            ? "오출 확인 — 1·2·3센터 오출 엑셀을 고르세요"
            : "오출 확인 — FF1·FF2·냉동 작업 엑셀을 고르세요";
        var files = PickMany(_app != IntPtr.Zero ? _app : _window, title);
        if (files.Length == 0 || _web == null) return;
        SendFiles("oship-check", many ? "wrong" : "work", files);
    }

    static void SendFiles(string type, string kind, IEnumerable<string> files)
    {
        if (_web == null) return;
        try
        {
            var parts = new List<string>();
            foreach (var file in files)
            {
                if (string.IsNullOrEmpty(file) || !File.Exists(file)) continue;
                var b64 = Convert.ToBase64String(ReadShared(file));
                parts.Add($"{{\"name\":{Json(Path.GetFileName(file))},\"b64\":\"{b64}\"}}");
            }
            if (parts.Count == 0) return;
            var kindJson = kind.Length == 0 ? "" : $",\"kind\":\"{kind}\"";
            _web.PostWebMessageAsString($"{{\"type\":\"{type}\"{kindJson},\"files\":[{string.Join(",", parts)}]}}");
        }
        catch (Exception ex)
        {
            Native.MessageBoxW(_app, BusyFileMessage(ex), "센터 생산성", 0);
        }
    }

    static void OpenRoster()
    {
        var file = PickFile(_app, "근태표를 고르세요");
        if (file.Length == 0 || _web == null) return;
        try
        {
            var b64 = Convert.ToBase64String(ReadShared(file));
            _web.PostWebMessageAsString($"{{\"type\":\"roster\",\"name\":{Json(Path.GetFileName(file))},\"b64\":\"{b64}\"}}");
        }
        catch (Exception ex)
        {
            Native.MessageBoxW(_app, BusyFileMessage(ex), "센터 생산성", 0);
        }
    }

    static void OpenArchive()
    {
        var files = PickMany(_app != IntPtr.Zero ? _app : _window, "생산성 분석 — 날짜_FF1, 날짜_FF2 파일을 여러 개 고르세요");
        if (files.Length == 0) return;
        var added = 0;
        try
        {
            foreach (var file in files)
            {
                if (!File.Exists(file)) continue;
                Remember(Path.GetFileName(file), "archive", ReadShared(file));
                added++;
            }
        }
        catch (Exception ex)
        {
            Native.MessageBoxW(_app, BusyFileMessage(ex), "센터 생산성", 0);
            return;
        }
        if (added == 0)
        {
            Native.MessageBoxW(_app, "고른 파일을 읽지 못했습니다.", "센터 생산성", 0);
            return;
        }
        LaunchSession("archive");
    }

    static bool _hostReady;
    static string HostDir()
    {
        var dir = Path.Combine(Path.GetTempPath(), "center-productivity-host");
        Directory.CreateDirectory(dir);
        return dir;
    }

    static void EnsureHost()
    {
        if (_web == null || _hostReady) return;
        _web.SetVirtualHostNameToFolderMapping("centerfiles.local", HostDir(), CoreWebView2HostResourceAccessKind.Allow);
        _hostReady = true;
    }

    static void OpenChosen()
    {
        if (Paths.All(string.IsNullOrEmpty))
        {
            Native.MessageBoxW(_app, "작업 엑셀이나 배치표를 하나 이상 고르세요.", "센터 생산성", 0);
            return;
        }
        if (_web == null)
        {
            try
            {
                Session.RemoveAll(item => item.Role != "archive");
                for (var i = 0; i < Paths.Length; i++)
                {
                    if (Paths[i].Length == 0) continue;
                    var role = SlotRole[i].Length > 0 ? SlotRole[i] : i < Roles.Length ? Roles[i] : "work";
                    Remember(Path.GetFileName(Paths[i]), role, ReadShared(Paths[i]));
                }
                LaunchSession("summary");
            }
            catch (Exception ex)
            {
                Native.MessageBoxW(_window, BusyFileMessage(ex), "센터 생산성", 0);
            }
            return;
        }
        var chosen = new List<(string Path, string Role)>();
        for (var i = 0; i < Paths.Length; i++)
        {
            if (Paths[i].Length == 0) continue;
            var role = SlotRole[i].Length > 0 ? SlotRole[i] : i < Roles.Length ? Roles[i] : "work";
            chosen.Add((Paths[i], role));
        }
        Native.SetWindowTextW(_app, "파일 여는 중");
        try { _web?.PostWebMessageAsString("{\"type\":\"work-status\",\"text\":\"센터 읽는 중\"}"); } catch { }
        Native.ShowWindow(_window, 0);
        System.Threading.Tasks.Task.Run(() =>
        {
            var trace = ReadTraceOn();
            if (trace) BeginVerify("구분=파일열기");
            try
            {
                var centers = new Dictionary<string, List<WorkJob>>(StringComparer.Ordinal);
                var extras = new List<(string Name, string Role, byte[] Bytes)>();
                foreach (var item in chosen)
                {
                    if (item.Role == "work" && TryReadWork(item.Path, centers)) continue;
                    extras.Add((Path.GetFileName(item.Path), item.Role, ReadShared(item.Path)));
                }
                var json = centers.Count > 0 ? WorkReadyJson(centers, extras) : WorkOpenJson(extras.Count > 0 ? extras : chosen.Select(item => (Path.GetFileName(item.Path), item.Role, ReadShared(item.Path))).ToList());
                void Send()
                {
                    try { _web?.PostWebMessageAsString(json); }
                    catch
                    {
                        Session.RemoveAll(file => file.Role != "archive");
                        foreach (var item in chosen) Remember(Path.GetFileName(item.Path), item.Role, ReadShared(item.Path));
                        LaunchSession("summary");
                        return;
                    }
                    Native.SetWindowTextW(_app, "센터 생산성  Build : " + BuildStamp.Label);
                }
                if (_ui != null) _ui.Post(_ => Send(), null);
                else Send();
            }
            catch (Exception ex)
            {
                void Fail()
                {
                    Native.SetWindowTextW(_app, "센터 생산성  Build : " + BuildStamp.Label);
                    Native.MessageBoxW(_app, BusyFileMessage(ex), "센터 생산성", 0);
                }
                if (_ui != null) _ui.Post(_ => Fail(), null);
                else Fail();
            }
            finally
            {
                if (trace) EndVerify();
            }
        });
    }

    readonly struct WorkJob(double? line, long? at, double qty, double order, string route, string storeCd, string storeNm, string goodsCd, string goodsNm, string location, string groupId)
    {
        public double? Line { get; } = line;
        public long? At { get; } = at;
        public double Qty { get; } = qty;
        public double Order { get; } = order;
        public string Route { get; } = route;
        public string StoreCd { get; } = storeCd;
        public string StoreNm { get; } = storeNm;
        public string GoodsCd { get; } = goodsCd;
        public string GoodsNm { get; } = goodsNm;
        public string Location { get; } = location;
        public string GroupId { get; } = groupId;
    }

    static readonly object ReadTraceGate = new();
    static int _verifyDepth;
    static string? _verifyPath;
    static long _traceCheckedAt;
    static bool _traceCached;

    static string ReadTraceDir() => Path.Combine(Path.GetTempPath(), "center-productivity-log");

    static bool ReadTraceOn()
    {
        var now = Environment.TickCount64;
        if (_traceCheckedAt != 0 && now - _traceCheckedAt < 2000) return _traceCached;
        var env = Environment.GetEnvironmentVariable("CENTER_READ_LOG");
        bool on;
        if (string.Equals(env, "0", StringComparison.OrdinalIgnoreCase) || string.Equals(env, "off", StringComparison.OrdinalIgnoreCase) || string.Equals(env, "false", StringComparison.OrdinalIgnoreCase)) on = false;
        else if (string.Equals(env, "1", StringComparison.OrdinalIgnoreCase) || string.Equals(env, "on", StringComparison.OrdinalIgnoreCase) || string.Equals(env, "true", StringComparison.OrdinalIgnoreCase)) on = true;
        else
        {
            var exeDir = Path.GetDirectoryName(Environment.ProcessPath ?? "") ?? "";
            on = (exeDir.Length > 0 && File.Exists(Path.Combine(exeDir, "read-log.on"))) || File.Exists(Path.Combine(ReadTraceDir(), "read-log.on"));
        }
        _traceCached = on;
        _traceCheckedAt = now;
        return on;
    }

    static void BeginVerify(string header)
    {
        try
        {
            lock (ReadTraceGate)
            {
                if (_verifyDepth == 0)
                {
                    var dir = ReadTraceDir();
                    Directory.CreateDirectory(dir);
                    var path = Path.Combine(dir, "verify-" + DateTime.Now.ToString("yyyyMMdd-HHmmss-fff") + ".txt");
                    File.WriteAllText(path, "build=" + BuildStamp.Label + "\r\n" + header.Replace("\r", " ").Replace("\n", " ") + "\r\n\r\n", new UTF8Encoding(false));
                    _verifyPath = path;
                    TraceLine("종류=검증파일\t경로=" + path);
                }
                _verifyDepth++;
            }
        }
        catch { }
    }

    static void EndVerify()
    {
        try
        {
            lock (ReadTraceGate)
            {
                if (_verifyDepth == 0) return;
                _verifyDepth--;
                if (_verifyDepth == 0 && _verifyPath != null)
                {
                    try { File.Copy(_verifyPath, Path.Combine(ReadTraceDir(), "verify-latest.txt"), true); } catch { }
                    _verifyPath = null;
                }
            }
        }
        catch { }
    }

    static void TraceLine(string text)
    {
        try
        {
            var line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + "\t" + text + "\r\n";
            lock (ReadTraceGate)
            {
                Directory.CreateDirectory(ReadTraceDir());
                File.AppendAllText(Path.Combine(ReadTraceDir(), "read.log"), line, new UTF8Encoding(false));
            }
        }
        catch { }
    }

    static void WriteVerify(string path, Dictionary<string, List<WorkJob>> named, bool accepted)
    {
        try
        {
            var text = new StringBuilder();
            text.Append("파일=").Append(path).Append("\r\n");
            text.Append("수용=").Append(accepted ? "예" : "아니오").Append("\r\n");
            if (named.Count == 0) text.Append("센터없음\r\n");
            foreach (var center in named.Keys.OrderBy(item => item, StringComparer.Ordinal))
            {
                var jobs = named[center];
                long? first = null;
                long? last = null;
                var atRows = 0;
                double qty = 0;
                foreach (var job in jobs)
                {
                    qty += job.Qty;
                    if (job.At == null) continue;
                    atRows++;
                    if (first == null || job.At < first) first = job.At;
                    if (last == null || job.At > last) last = job.At;
                }
                text.Append("센터=").Append(center)
                    .Append("\t행수=").Append(jobs.Count.ToString(System.Globalization.CultureInfo.InvariantCulture))
                    .Append("\tAt있는행=").Append(atRows.ToString(System.Globalization.CultureInfo.InvariantCulture))
                    .Append("\t수량합=").Append(qty.ToString("G17", System.Globalization.CultureInfo.InvariantCulture))
                    .Append("\t최초At=").Append(AtText(first))
                    .Append("\t최종At=").Append(AtText(last))
                    .Append("\r\n");
            }
            text.Append("\r\n");
            lock (ReadTraceGate)
            {
                if (_verifyPath == null) return;
                File.AppendAllText(_verifyPath, text.ToString(), new UTF8Encoding(false));
            }
        }
        catch { }
    }

    static string AtText(long? at)
    {
        if (at == null) return "";
        var clock = DateTimeOffset.FromUnixTimeMilliseconds(at.Value).ToString("yyyy-MM-dd HH:mm:ss", System.Globalization.CultureInfo.InvariantCulture);
        return at.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) + " " + clock;
    }

    static bool TryReadWork(string path, Dictionary<string, List<WorkJob>> into, bool requireStamp = true)
    {
        var trace = ReadTraceOn();
        var fileSw = trace ? System.Diagnostics.Stopwatch.StartNew() : null;
        var sheetCount = 0;
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        using var reader = ExcelReaderFactory.CreateReader(stream);
        var named = new Dictionary<string, List<WorkJob>>(StringComparer.Ordinal);
        List<WorkJob>? fallback = null;
        var fallbackRaw = false;
        do
        {
            var name = reader.Name ?? "";
            var sheetSw = trace ? System.Diagnostics.Stopwatch.StartNew() : null;
            var jobs = ReadWorkSheet(reader);
            if (sheetSw != null)
            {
                sheetSw.Stop();
                sheetCount++;
                TraceLine("종류=시트\t파일=" + path + "\t시트=" + name + "\t행수=" + jobs.Count.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t밀리초=" + sheetSw.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            var center = WorkCenter(name);
            if (center != null)
            {
                if (!named.TryGetValue(center, out var list)) named[center] = list = [];
                list.AddRange(jobs);
            }
            else if (name.Contains("orderdetail", StringComparison.OrdinalIgnoreCase))
            {
                fallback = jobs;
                fallbackRaw = true;
            }
            else if (!fallbackRaw && fallback == null)
            {
                fallback = jobs;
            }
        }
        while (reader.NextResult());
        var accepted = true;
        if (named.Count == 0)
        {
            if (fallback == null || fallback.Count == 0) accepted = false;
            else named["1센터"] = fallback;
        }
        if (accepted && requireStamp && !named.Any(item => item.Value.Any(job => job.At != null))) accepted = false;
        if (accepted && !requireStamp && named.All(item => item.Value.Count == 0)) accepted = false;
        if (accepted)
        {
            foreach (var item in named)
            {
                if (!into.TryGetValue(item.Key, out var list)) into[item.Key] = list = [];
                list.AddRange(item.Value);
            }
        }
        if (fileSw != null)
        {
            fileSw.Stop();
            TraceLine("종류=파일\t파일=" + path + "\t수용=" + (accepted ? "예" : "아니오") + "\t시트수=" + sheetCount.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t밀리초=" + fileSw.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
            WriteVerify(path, named, accepted);
        }
        return accepted;
    }

    static List<WorkJob> ReadWorkSheet(IExcelDataReader reader)
    {
        var jobs = new List<WorkJob>();
        if (!reader.Read()) return jobs;
        var head = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < reader.FieldCount; i++)
        {
            var text = WorkText(reader.GetValue(i)).ToLowerInvariant();
            if (text.Length > 0 && !head.ContainsKey(text)) head[text] = i;
        }
        var header = head.ContainsKey("blockno") && head.ContainsKey("pickdt");
        int Col(string key, int fallback) => header && head.TryGetValue(key, out var at) ? at : fallback;
        int Opt(params string[] keys)
        {
            if (!header) return -1;
            foreach (var key in keys)
                if (head.TryGetValue(key, out var at)) return at;
            return -1;
        }
        var block = Col("blockno", 17);
        var pick = Col("pickdt", 25);
        var qty = Col("pickqt", 12);
        var order = Opt("orderqt");
        var route = Opt("rtecod");
        var storeCd = Opt("clientcd", "storecd", "점포코드");
        var storeNm = Opt("clientnm", "storenm", "점포명");
        var goodsCd = Opt("goodscd", "상품코드");
        var goodsNm = Opt("goodsnm", "상품명");
        var location = Opt("locationcd", "loccd", "로케이션코드", "로케이션");
        var group = Opt("groupid");
        void Take()
        {
            var line = WorkNum(Cell(reader, block));
            var groupId = group >= 0 ? WorkText(Cell(reader, group)) : "";
            if (line == null && groupId.Length == 0) return;
            var qtyRaw = WorkNum(Cell(reader, qty));
            var orderRaw = order >= 0 ? WorkNum(Cell(reader, order)) : null;
            jobs.Add(new WorkJob(
                line,
                WorkAt(Cell(reader, pick)),
                qtyRaw ?? 0,
                orderRaw ?? 0,
                route >= 0 ? WorkText(Cell(reader, route)) : "",
                storeCd >= 0 ? WorkText(Cell(reader, storeCd)) : "",
                storeNm >= 0 ? WorkText(Cell(reader, storeNm)) : "",
                goodsCd >= 0 ? WorkText(Cell(reader, goodsCd)) : "",
                goodsNm >= 0 ? WorkText(Cell(reader, goodsNm)) : "",
                location >= 0 ? WorkText(Cell(reader, location)) : "",
                groupId));
        }
        if (!header) Take();
        while (reader.Read()) Take();
        return jobs;
    }

    static object? Cell(IExcelDataReader reader, int index)
    {
        if (index < 0 || index >= reader.FieldCount) return null;
        return reader.GetValue(index);
    }

    static string? WorkCenter(string name)
    {
        var trimmed = name.Trim();
        if (trimmed.StartsWith("원본_", StringComparison.Ordinal)) trimmed = trimmed[3..];
        if (trimmed.Length is >= 3 and <= 4 && trimmed[0] is >= '1' and <= '9' && trimmed.AsSpan(1).SequenceEqual("센터"))
            return trimmed;
        return null;
    }

    static double? WorkNum(object? value)
    {
        if (value is null or DBNull) return null;
        if (value is double number) return double.IsFinite(number) ? number : null;
        if (value is float number2) return number2;
        if (value is int number3) return number3;
        if (value is long number4) return number4;
        if (value is decimal number5) return (double)number5;
        return double.TryParse(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed) && double.IsFinite(parsed) ? parsed : null;
    }

    static long? WorkAt(object? value)
    {
        if (value is DateTime dt && dt.Year is >= 1900 and <= 2200) return UtcMillis(dt);
        var serial = WorkNum(value);
        if (serial is > 20000 and < 80000) return (long)Math.Round((serial.Value - 25569d) * 86400000d);
        var text = WorkText(value);
        if (text.Length < 8) return null;
        var korean = System.Text.RegularExpressions.Regex.Match(text, @"(\d{4})-(\d{1,2})-(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?");
        if (korean.Success)
        {
            var hour = int.Parse(korean.Groups[5].Value);
            if (korean.Groups[4].Value == "오후" && hour != 12) hour += 12;
            if (korean.Groups[4].Value == "오전" && hour == 12) hour = 0;
            return UtcMillis(new DateTime(int.Parse(korean.Groups[1].Value), int.Parse(korean.Groups[2].Value), int.Parse(korean.Groups[3].Value), hour, int.Parse(korean.Groups[6].Value), korean.Groups[7].Success ? int.Parse(korean.Groups[7].Value) : 0));
        }
        var plain = System.Text.RegularExpressions.Regex.Match(text, @"(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?");
        if (!plain.Success) return null;
        return UtcMillis(new DateTime(int.Parse(plain.Groups[1].Value), int.Parse(plain.Groups[2].Value), int.Parse(plain.Groups[3].Value), int.Parse(plain.Groups[4].Value), int.Parse(plain.Groups[5].Value), plain.Groups[6].Success ? int.Parse(plain.Groups[6].Value) : 0));
    }

    static long UtcMillis(DateTime dt)
    {
        return new DateTimeOffset(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, dt.Second, TimeSpan.Zero).ToUnixTimeMilliseconds();
    }

    static string WorkText(object? value)
    {
        if (value is null or DBNull) return "";
        if (value is double number)
        {
            var rounded = Math.Round(number);
            if (Math.Abs(number - rounded) < 0.000001) return ((long)rounded).ToString(System.Globalization.CultureInfo.InvariantCulture);
            return number.ToString(System.Globalization.CultureInfo.InvariantCulture);
        }
        return Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)?.Trim() ?? "";
    }

    static string WorkReadyJson(Dictionary<string, List<WorkJob>> centers, List<(string Name, string Role, byte[] Bytes)> extras)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("type", "work-ready");
            writer.WritePropertyName("centers");
            writer.WriteStartObject();
            foreach (var center in centers)
            {
                writer.WritePropertyName(center.Key);
                writer.WriteStartArray();
                foreach (var job in center.Value)
                {
                    writer.WriteStartArray();
                    if (job.Line is double line) writer.WriteNumberValue(line); else writer.WriteNullValue();
                    if (job.At is long at) writer.WriteNumberValue(at); else writer.WriteNullValue();
                    writer.WriteNumberValue(job.Qty);
                    writer.WriteNumberValue(job.Order);
                    writer.WriteStringValue(job.Route);
                    writer.WriteStringValue(job.StoreCd);
                    writer.WriteStringValue(job.StoreNm);
                    writer.WriteStringValue(job.GoodsCd);
                    writer.WriteStringValue(job.GoodsNm);
                    writer.WriteStringValue(job.Location);
                    writer.WriteStringValue(job.GroupId);
                    writer.WriteEndArray();
                }
                writer.WriteEndArray();
            }
            writer.WriteEndObject();
            writer.WritePropertyName("files");
            writer.WriteStartArray();
            foreach (var extra in extras)
            {
                writer.WriteStartObject();
                writer.WriteString("name", extra.Name);
                writer.WriteString("role", extra.Role);
                writer.WriteString("b64", Convert.ToBase64String(extra.Bytes));
                writer.WriteEndObject();
            }
            writer.WriteEndArray();
            writer.WriteEndObject();
        }
        return Encoding.UTF8.GetString(stream.ToArray());
    }

    static string WorkOpenJson(List<(string Name, string Role, byte[] Bytes)> files)
    {
        var parts = files.Select(item => $"{{\"name\":{Json(item.Name)},\"role\":{Json(item.Role)},\"b64\":\"{Convert.ToBase64String(item.Bytes)}\"}}");
        return "{\"type\":\"work-open\",\"files\":[" + string.Join(",", parts) + "]}";
    }

    static void MergeIntoArchive()
    {
        if (MergePaths.All(string.IsNullOrEmpty))
        {
            Native.MessageBoxW(_merge, "센터 파일을 하나 이상 고르세요.", "센터 파일 합치기", 0);
            return;
        }
        var save = SavePath(_merge, "업로드용.xlsx", "합친 파일을 저장할 곳을 고르세요");
        if (save.Length == 0) return;
        try
        {
            Native.SetWindowTextW(_mergeStatus, "엑셀 만드는 중");
            var notes = new List<string>();
            var usedSheets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var sheets = new List<(string Name, string Path)>();
            var texts = new SlimTexts();
            try
            {
                for (var i = 0; i < MergePaths.Length; i++)
                {
                    if (MergePaths[i].Length == 0) continue;
                    var title = SlotLabel(true, i);
                    var sheetName = title;
                    if (!usedSheets.Add(sheetName)) sheetName = title + (i + 1);
                    if (sheetName.Length > 31) sheetName = sheetName[..31];
                    Native.SetWindowTextW(_mergeStatus, $"{title} 줄이는 중");
                    var temp = Path.Combine(Path.GetTempPath(), "center-slim-" + Guid.NewGuid().ToString("N") + ".xml");
                    var rows = WriteSlimSheet(MergePaths[i], temp, texts, (done) => Native.SetWindowTextW(_mergeStatus, $"{title} {done:N0}행"));
                    sheets.Add((sheetName, temp));
                    notes.Add($"{title} {rows:N0}행 · 11열");
                }
                if (sheets.Count == 0) throw new Exception("합칠 파일이 없습니다.");
                if (File.Exists(save)) File.Delete(save);
                WriteSlimBook(save, sheets, texts);
            }
            finally
            {
                foreach (var sheet in sheets)
                {
                    try { if (File.Exists(sheet.Path)) File.Delete(sheet.Path); } catch { }
                }
            }
            Native.SetWindowTextW(_mergeStatus, "저장했습니다. " + Path.GetFileName(save));
            Native.MessageBoxW(_merge, "필요한 열만 넣어 만들었습니다.\nBlockNO, PickDT, PickQT, OrderQT, RteCOD, 점포, 상품, 로케이션, GroupID\n\n" + string.Join("\n", notes) + "\n\n" + save, "센터 파일 합치기", 0);
        }
        catch (Exception ex)
        {
            Native.SetWindowTextW(_mergeStatus, "실패");
            Native.MessageBoxW(_merge, ex.Message, "센터 파일 합치기", 0);
        }
    }

    static byte[] ReadShared(string path)
    {
        using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
        var length = stream.Length;
        if (length > int.MaxValue) throw new IOException("파일이 너무 큽니다.");
        var bytes = new byte[length];
        var offset = 0;
        while (offset < bytes.Length)
        {
            var read = stream.Read(bytes, offset, bytes.Length - offset);
            if (read == 0) break;
            offset += read;
        }
        if (offset != bytes.Length) Array.Resize(ref bytes, offset);
        return bytes;
    }

    static string BusyFileMessage(Exception ex)
    {
        return "파일을 읽지 못했습니다.\n다른 사람이 엑셀로 열어 두었거나, 공유폴더에서 잠겨 있으면 이렇게 됩니다.\n그 사람이 파일을 닫은 뒤 다시 열어 주세요.\n\n" + ex.Message;
    }

    static void Remember(string name, string role, byte[] bytes)
    {
        if (role == "archive")
            Session.RemoveAll(item => item.Role == "archive" && item.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        Session.Add(new SessionFile(name, role, Convert.ToBase64String(bytes)));
    }

    static void LaunchSession(string tab)
    {
        var html = LoadHtml();
        if (html == null)
        {
            Native.MessageBoxW(_app, "화면 파일을 찾지 못했습니다. EXE를 다시 받아 주세요.", "센터 생산성", 0);
            return;
        }
        var parts = string.Join(",", Session.Select(item => $"{{\"name\":{Json(item.Name)},\"role\":{Json(item.Role)},\"b64\":\"{item.B64}\"}}"));
        LaunchHtml(WithCompanyFlag(html, "[" + parts + "]", tab));
    }

    static string SavePath(IntPtr owner, string suggested, string title)
    {
        var buffer = Marshal.AllocHGlobal(520 * 2);
        try
        {
            for (var i = 0; i < 520 * 2; i++) Marshal.WriteByte(buffer, i, 0);
            var preset = Encoding.Unicode.GetBytes(suggested);
            Marshal.Copy(preset, 0, buffer, Math.Min(preset.Length, 500));
            var ofn = new Native.OPENFILENAMEW
            {
                hwndOwner = owner,
                lpstrFilter = "Excel (*.xlsx)\0*.xlsx\0\0",
                lpstrFile = buffer,
                nMaxFile = 520,
                lpstrTitle = title,
                lpstrDefExt = "xlsx",
                Flags = OFN_EXPLORER | OFN_PATHMUSTEXIST | OFN_OVERWRITEPROMPT,
            };
            ofn.lStructSize = Marshal.SizeOf<Native.OPENFILENAMEW>();
            if (!Native.GetSaveFileNameW(ref ofn)) return "";
            var path = Marshal.PtrToStringUni(buffer) ?? "";
            if (path.Length > 0 && !path.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase)) path += ".xlsx";
            return path;
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }

    static void SaveXlsx(string name, string b64)
    {
        if (string.IsNullOrWhiteSpace(b64)) throw new Exception("저장할 내용이 없습니다.");
        var safe = Path.GetFileName(name);
        if (string.IsNullOrWhiteSpace(safe)) safe = "출고_업로드.xlsx";
        var owner = _window != IntPtr.Zero ? _window : _app;
        if (owner != IntPtr.Zero) Native.SetForegroundWindow(owner);
        var path = SavePath(owner, safe, "업로드 파일을 저장할 곳을 고르세요");
        if (path.Length == 0) return;
        File.WriteAllBytes(path, Convert.FromBase64String(b64));
    }

    static readonly (string Name, string[] Aliases, int Fallback)[] SlimCols =
    [
        ("BlockNO", ["blockno"], 17),
        ("PickDT", ["pickdt"], 25),
        ("PickQT", ["pickqt"], 12),
        ("OrderQT", ["orderqt"], -1),
        ("RteCOD", ["rtecod"], -1),
        ("ClientCD", ["clientcd", "storecd", "점포코드"], -1),
        ("ClientNM", ["clientnm", "storenm", "점포명"], -1),
        ("GoodsCD", ["goodscd", "상품코드"], -1),
        ("GoodsNM", ["goodsnm", "상품명"], -1),
        ("LocationCD", ["locationcd", "loccd", "로케이션코드", "로케이션"], -1),
        ("GroupID", ["groupid"], -1),
    ];

    sealed class SlimTexts
    {
        public readonly List<string> Items = [];
        readonly Dictionary<string, int> _index = new(StringComparer.Ordinal);
        public int Add(string text)
        {
            if (_index.TryGetValue(text, out var at)) return at;
            at = Items.Count;
            Items.Add(text);
            _index[text] = at;
            return at;
        }
    }

    static int WriteSlimSheet(string path, string xmlPath, SlimTexts texts, Action<int> progress)
    {
        using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var reader = ExcelReaderFactory.CreateReader(stream);
        var names = new List<string>();
        do
        {
            names.Add(reader.Name);
            if (!IsDetail(reader.Name)) continue;
            return WriteOpenedSheet(reader, xmlPath, texts, progress, true);
        }
        while (reader.NextResult());
        throw new Exception($"{Path.GetFileName(path)} 에서 OrderDetail 시트를 찾지 못했습니다.\n있는 시트: {string.Join(", ", names)}");
    }

    static int WriteOpenedSheet(IExcelDataReader reader, string xmlPath, SlimTexts texts, Action<int> progress, bool fallback)
    {
        if (!reader.Read())
        {
            if (fallback) throw new Exception("OrderDetail이 비어 있습니다.");
            return -1;
        }
        var indexes = SlimIndexes(reader, out var header, fallback);
        if (!header && !fallback) return -1;
        if (indexes.All(index => index < 0))
        {
            if (fallback) throw new Exception("BlockNO 열을 찾지 못했습니다.");
            return -1;
        }
        var kept = indexes.Select((index, nth) => (index, nth)).Where(item => item.index >= 0).ToList();
        using var output = new StreamWriter(xmlPath, false, new UTF8Encoding(false));
        output.Write("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>""");
        output.Write("<row r=\"1\">");
        for (var c = 0; c < kept.Count; c++) output.Write(SlimTextCell(ColLetter(c), 1, SlimCols[kept[c].nth].Name, texts));
        output.Write("</row>");
        var written = 0;
        var excelRow = 2;
        void WriteData()
        {
            var cells = Enumerable.Repeat("", kept.Count).ToArray();
            var any = false;
            for (var c = 0; c < kept.Count; c++)
            {
                if (kept[c].index >= reader.FieldCount) continue;
                var value = reader.GetValue(kept[c].index);
                var cell = SlimCell(ColLetter(c), excelRow, value, texts);
                cells[c] = cell;
                if (cell.Length > 0) any = true;
            }
            if (!any) return;
            output.Write($"<row r=\"{excelRow}\">");
            foreach (var cell in cells) output.Write(cell);
            output.Write("</row>");
            written++;
            excelRow++;
            if (written % 20000 == 0) progress(written);
        }
        if (!header) WriteData();
        while (reader.Read()) WriteData();
        output.Write("</sheetData></worksheet>");
        if (written == 0 && fallback) throw new Exception("OrderDetail에 데이터 행이 없습니다.");
        return written;
    }

    static void LightenChosen()
    {
        var owner = _app != IntPtr.Zero ? _app : _window;
        var files = PickMany(owner, "가볍게 만들 엑셀을 고르세요. 같은 폴더, 같은 이름으로 덮어씁니다.");
        if (files.Length == 0) return;
        if (Native.MessageBoxW(owner, $"{files.Length}개 파일을 같은 이름으로 덮어씁니다.\n필요한 열만 남고, 나머지 열은 사라집니다.", "라이트하게 만들기", 0x31) != 1) return;
        var notes = new List<string>();
        foreach (var file in files)
        {
            var temps = new List<(string Name, string Path)>();
            var book = Path.Combine(Path.GetDirectoryName(file) ?? "", "." + Path.GetFileName(file) + ".slimtmp");
            try
            {
                var texts = new SlimTexts();
                var total = 0;
                var seen = false;
                using (var stream = File.Open(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                using (var reader = ExcelReaderFactory.CreateReader(stream))
                {
                    do
                    {
                        var xml = Path.Combine(Path.GetTempPath(), "center-slim-" + Guid.NewGuid().ToString("N") + ".xml");
                        var rows = WriteOpenedSheet(reader, xml, texts, done => Native.SetWindowTextW(_app, Path.GetFileName(file) + " " + done.ToString("N0") + "행"), IsDetail(reader.Name));
                        if (rows < 0)
                        {
                            try { File.Delete(xml); } catch { }
                            continue;
                        }
                        seen = true;
                        if (rows == 0)
                        {
                            try { File.Delete(xml); } catch { }
                            continue;
                        }
                        temps.Add((SheetTitle(reader.Name), xml));
                        total += rows;
                    }
                    while (reader.NextResult());
                }
                if (!seen || temps.Count == 0) throw new Exception("작업 시트를 찾지 못했습니다.");
                if (File.Exists(book)) File.Delete(book);
                WriteSlimBook(book, temps, texts);
                ReplaceReady(book, file);
                notes.Add($"{Path.GetFileName(file)} · {temps.Count}시트 · {total:N0}행");
            }
            catch (Exception ex)
            {
                notes.Add($"{Path.GetFileName(file)} · {ex.Message}");
                try { if (File.Exists(book)) File.Delete(book); } catch { }
            }
            finally
            {
                foreach (var temp in temps)
                {
                    try { if (File.Exists(temp.Path)) File.Delete(temp.Path); } catch { }
                }
            }
        }
        Native.SetWindowTextW(_app, "센터 생산성  Build : " + BuildStamp.Label);
        Native.MessageBoxW(owner, string.Join("\n", notes), "라이트하게 만들기", 0);
    }

    static void ReplaceReady(string source, string dest)
    {
        for (var attempt = 0; attempt < 6; attempt++)
        {
            try
            {
                File.Replace(source, dest, null);
                return;
            }
            catch (IOException) when (attempt < 5)
            {
                Thread.Sleep(300);
            }
        }
        throw new IOException("파일이 다른 프로그램에서 열려 있습니다. 엑셀에서 닫고 다시 해 주세요.");
    }

    static string SheetTitle(string name)
    {
        var text = name.Replace('\\', ' ').Replace('/', ' ').Replace('*', ' ').Replace('?', ' ').Replace(':', ' ').Replace('[', ' ').Replace(']', ' ').Trim();
        if (text.Length == 0) text = "Sheet";
        return text.Length > 31 ? text[..31] : text;
    }

    static int[] SlimIndexes(IExcelDataReader reader, out bool header, bool fallback)
    {
        var count = reader.FieldCount;
        var names = new string[count];
        for (var c = 0; c < count; c++) names[c] = Convert.ToString(reader.GetValue(c))?.Trim().ToLowerInvariant() ?? "";
        header = names.Any(name => name is "blockno" or "pickdt");
        var indexes = new int[SlimCols.Length];
        for (var i = 0; i < SlimCols.Length; i++)
        {
            var at = -1;
            foreach (var alias in SlimCols[i].Aliases)
            {
                at = Array.FindIndex(names, name => name == alias);
                if (at >= 0) break;
            }
            if (at < 0 && fallback && !header && SlimCols[i].Fallback >= 0 && SlimCols[i].Fallback < count) at = SlimCols[i].Fallback;
            indexes[i] = at;
        }
        return indexes;
    }

    static string SlimTextCell(string col, int row, string text, SlimTexts texts)
    {
        return $"<c r=\"{col}{row}\" t=\"s\"><v>{texts.Add(text)}</v></c>";
    }

    static string SlimCell(string col, int row, object? value, SlimTexts texts)
    {
        if (value == null || value is DBNull) return "";
        if (value is DateTime stamp)
        {
            var serial = (stamp - new DateTime(1899, 12, 30)).TotalDays.ToString(System.Globalization.CultureInfo.InvariantCulture);
            return $"<c r=\"{col}{row}\"><v>{serial}</v></c>";
        }
        if (value is bool flag) return $"<c r=\"{col}{row}\"><v>{(flag ? 1 : 0)}</v></c>";
        if (value is double or float or decimal or int or long or short)
        {
            var number = Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture);
            if (string.IsNullOrEmpty(number)) return "";
            return $"<c r=\"{col}{row}\"><v>{number}</v></c>";
        }
        var text = Convert.ToString(value)?.Trim() ?? "";
        if (text.Length == 0) return "";
        return SlimTextCell(col, row, text, texts);
    }

    static string ColLetter(int index)
    {
        var n = index + 1;
        var text = "";
        while (n > 0)
        {
            n--;
            text = (char)('A' + (n % 26)) + text;
            n /= 26;
        }
        return text;
    }

    static string XmlText(string text)
    {
        var sb = new StringBuilder(text.Length);
        foreach (var ch in text)
        {
            if (ch == '&') sb.Append("&" + "amp;");
            else if (ch == '<') sb.Append("&" + "lt;");
            else if (ch == '>') sb.Append("&" + "gt;");
            else if (ch == '\t' || ch == '\n' || ch == '\r' || ch >= ' ') sb.Append(ch);
        }
        return sb.ToString();
    }

    static void WriteSlimBook(string save, List<(string Name, string Path)> sheets, SlimTexts texts)
    {
        using var zip = ZipFile.Open(save, ZipArchiveMode.Create);
        void AddText(string name, string text)
        {
            var entry = zip.CreateEntry(name, CompressionLevel.Optimal);
            using var stream = entry.Open();
            using var writer = new StreamWriter(stream, new UTF8Encoding(false));
            writer.Write(text);
        }
        var types = new StringBuilder();
        types.Append("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>""");
        var rels = new StringBuilder();
        rels.Append("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">""");
        var book = new StringBuilder();
        book.Append("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>""");
        for (var i = 0; i < sheets.Count; i++)
        {
            var id = i + 1;
            types.Append($"""<Override PartName="/xl/worksheets/sheet{id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>""");
            rels.Append($"""<Relationship Id="rId{id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{id}.xml"/>""");
            book.Append($"""<sheet name="{XmlText(sheets[i].Name)}" sheetId="{id}" r:id="rId{id}"/>""");
            var entry = zip.CreateEntry($"xl/worksheets/sheet{id}.xml", CompressionLevel.Optimal);
            using var source = File.OpenRead(sheets[i].Path);
            using var target = entry.Open();
            source.CopyTo(target);
        }
        if (texts.Items.Count > 0)
        {
            var sid = sheets.Count + 1;
            types.Append("""<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>""");
            rels.Append($"""<Relationship Id="rId{sid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>""");
        }
        types.Append("</Types>");
        rels.Append("</Relationships>");
        book.Append("</sheets></workbook>");
        AddText("[Content_Types].xml", types.ToString());
        AddText("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>""");
        AddText("xl/_rels/workbook.xml.rels", rels.ToString());
        AddText("xl/workbook.xml", book.ToString());
        if (texts.Items.Count > 0)
        {
            var entry = zip.CreateEntry("xl/sharedStrings.xml", CompressionLevel.Optimal);
            using var stream = entry.Open();
            using var writer = new StreamWriter(stream, new UTF8Encoding(false));
            writer.Write($"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{texts.Items.Count}" uniqueCount="{texts.Items.Count}">""");
            foreach (var item in texts.Items) writer.Write("<si><t>" + XmlText(item) + "</t></si>");
            writer.Write("</sst>");
        }
    }

    static bool IsDetail(string name)
    {
        var key = name.Trim().ToLowerInvariant().Replace(" ", "");
        return key is "torderdetail" or "orderdetail" || key.Contains("orderdetail");
    }

    static void MakeReadable(string path)
    {
        var temp = path + ".fixing";
        using (var input = ZipFile.OpenRead(path))
        using (var output = ZipFile.Open(temp, ZipArchiveMode.Create))
        {
            foreach (var entry in input.Entries)
            {
                var created = output.CreateEntry(entry.FullName, CompressionLevel.Optimal);
                using var source = entry.Open();
                using var target = created.Open();
                var xml = entry.FullName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) || entry.FullName.EndsWith(".rels", StringComparison.OrdinalIgnoreCase);
                if (!xml)
                {
                    source.CopyTo(target);
                    continue;
                }
                using var reader = new StreamReader(source, Encoding.UTF8);
                var text = reader.ReadToEnd().TrimStart('\uFEFF').Replace("<x:", "<").Replace("</x:", "</");
                using var writer = new StreamWriter(target, new UTF8Encoding(false));
                writer.Write(text);
            }
        }
        File.Copy(temp, path, true);
        File.Delete(temp);
    }

    static void Launch(List<string> parts)
    {
        var html = LoadHtml();
        if (html == null)
        {
            Native.MessageBoxW(_app, "화면 파일을 찾지 못했습니다. EXE를 다시 받아 주세요.", "센터 생산성", 0);
            return;
        }
        LaunchHtml(WithCompanyFlag(html, "[" + string.Join(",", parts) + "]"));
    }

    static async Task InitWeb()
    {
        try
        {
            var data = Path.Combine(Path.GetTempPath(), "center-productivity-wv2");
            Directory.CreateDirectory(data);
            var env = await CoreWebView2Environment.CreateAsync(null, data);
            _controller = await env.CreateCoreWebView2ControllerAsync(_viewHost);
            _web = _controller.CoreWebView2;
            _web.Settings.AreDevToolsEnabled = false;
            _web.Settings.IsStatusBarEnabled = false;
            _web.WebMessageReceived += (_, e) =>
            {
                var mode = e.TryGetWebMessageAsString() ?? "";
                if (mode.StartsWith("pick-work-", StringComparison.Ordinal))
                {
                    var body = mode["pick-work-".Length..];
                    var bar = body.IndexOf('|');
                    var indexText = bar >= 0 ? body[..bar] : body;
                    var role = bar >= 0 ? body[(bar + 1)..] : "";
                    if (int.TryParse(indexText, out var workIndex) && workIndex >= 0 && workIndex < Paths.Length)
                    {
                        if (role.Length > 0 && role.Length < 40 && role.IndexOfAny(['<', '>', '"']) < 0) SlotRole[workIndex] = role;
                        PickSlot(false, workIndex);
                    }
                    return;
                }
                if (mode.StartsWith("pick-merge-", StringComparison.Ordinal))
                {
                    var body = mode["pick-merge-".Length..];
                    var bar = body.IndexOf('|');
                    var indexText = bar >= 0 ? body[..bar] : body;
                    var role = bar >= 0 ? body[(bar + 1)..] : "";
                    if (int.TryParse(indexText, out var mergeIndex) && mergeIndex >= 0 && mergeIndex < MergePaths.Length)
                    {
                        if (role.Length > 0 && role.Length < 40 && role.IndexOfAny(['<', '>', '"']) < 0) MergeTitles[mergeIndex] = role;
                        PickSlot(true, mergeIndex);
                    }
                    return;
                }
                if (mode == "open-work")
                {
                    OpenChosen();
                    return;
                }
                if (mode == "make-merge")
                {
                    MergeIntoArchive();
                    return;
                }
                if (mode == "make-light")
                {
                    LightenChosen();
                    return;
                }
                if (mode == "archive")
                {
                    OpenArchive();
                    return;
                }
                if (mode.StartsWith("pace-save:", StringComparison.Ordinal))
                {
                    var body = mode["pace-save:".Length..];
                    if (body.Length > 0 && body.Length < 20000 && !body.Contains('<')) _paceHand = body;
                    return;
                }
                if (mode.StartsWith("panel-save:", StringComparison.Ordinal))
                {
                    SavePanel(mode["panel-save:".Length..]);
                    return;
                }
                if (mode == "panel-pull")
                {
                    System.Threading.Tasks.Task.Run(PullRemotePanel);
                    return;
                }
                if (mode.StartsWith("pick-folder:", StringComparison.Ordinal))
                {
                    PickFolder(mode["pick-folder:".Length..]);
                    return;
                }
                if (mode.StartsWith("set-folder:", StringComparison.Ordinal))
                {
                    var body = mode["set-folder:".Length..];
                    var bar = body.IndexOf('|');
                    var key = bar >= 0 ? body[..bar] : body;
                    var path = bar >= 0 ? body[(bar + 1)..] : "";
                    SetFolder(key, path);
                    return;
                }
                if (mode.StartsWith("set-ui:", StringComparison.Ordinal))
                {
                    SaveUi(mode["set-ui:".Length..]);
                    return;
                }
                if (mode.StartsWith("read-folder:", StringComparison.Ordinal))
                {
                    var body = mode["read-folder:".Length..];
                    var folderYear = 2026;
                    var folderKey = body;
                    var folderBar = body.IndexOf('|');
                    if (folderBar >= 0)
                    {
                        folderKey = body[..folderBar];
                        if (!int.TryParse(body[(folderBar + 1)..], out folderYear) || folderYear < 2000) folderYear = 2026;
                    }
                    System.Threading.Tasks.Task.Run(() => ReadFolder(folderKey, folderYear));
                    return;
                }
                if (mode == "roster")
                {
                    OpenRoster();
                    return;
                }
                if (mode == "ledger")
                {
                    OpenLedger();
                    return;
                }
                if (mode == "oship-upload")
                {
                    OpenOshipUpload();
                    return;
                }
                if (mode == "oship-work")
                {
                    OpenOshipCheck(false);
                    return;
                }
                if (mode == "oship-wrong")
                {
                    OpenOshipCheck(true);
                    return;
                }
                if (mode.StartsWith("{", StringComparison.Ordinal))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(mode);
                        if (doc.RootElement.TryGetProperty("type", out var type) && type.GetString() == "clipboard-png")
                            CopyPng(doc.RootElement.GetProperty("b64").GetString() ?? "");
                        else if (doc.RootElement.TryGetProperty("type", out var saveType) && saveType.GetString() == "save-xlsx")
                            SaveXlsx(doc.RootElement.GetProperty("name").GetString() ?? "출고_업로드.xlsx", doc.RootElement.GetProperty("b64").GetString() ?? "");
                    }
                    catch (Exception ex)
                    {
                        Native.MessageBoxW(_app, ex.Message, "센터 생산성", 0);
                    }
                }
            };
            FitView();
            var html = LoadHtml();
            if (html != null)
                LaunchHtml(WithCompanyFlag(html, "[]"));
            StartPanelWatch();
        }
        catch (Exception ex)
        {
            _web = null;
            Native.MessageBoxW(_app, "한 창으로 열지 못했습니다. Edge 창으로 엽니다.\n" + ex.Message, "센터 생산성", 0);
        }
    }

    static void CopyPng(string b64)
    {
        var bytes = Convert.FromBase64String(b64);
        using var stream = new MemoryStream(bytes);
        using var source = new Bitmap(stream);
        using var bmp = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(bmp))
        {
            g.DrawImage(source, 0, 0, source.Width, source.Height);
        }
        var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
        var data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            var stride = Math.Abs(data.Stride);
            var header = 40;
            var size = header + stride * bmp.Height;
            var mem = Native.GlobalAlloc(0x0002, (UIntPtr)size);
            if (mem == IntPtr.Zero) throw new Exception("클립보드 메모리를 만들지 못했습니다.");
            var ptr = Native.GlobalLock(mem);
            try
            {
                Marshal.WriteInt32(ptr, 0, header);
                Marshal.WriteInt32(ptr, 4, bmp.Width);
                Marshal.WriteInt32(ptr, 8, bmp.Height);
                Marshal.WriteInt16(ptr, 12, 1);
                Marshal.WriteInt16(ptr, 14, 32);
                for (var i = 16; i < header; i++) Marshal.WriteByte(ptr, i, 0);
                var raw = new byte[stride * bmp.Height];
                Marshal.Copy(data.Scan0, raw, 0, raw.Length);
                for (var y = 0; y < bmp.Height; y++)
                {
                    var src = (data.Stride < 0 ? bmp.Height - 1 - y : y) * stride;
                    var dst = (bmp.Height - 1 - y) * stride;
                    Marshal.Copy(raw, src, ptr + header + dst, stride);
                }
            }
            finally
            {
                Native.GlobalUnlock(mem);
            }
            if (!Native.OpenClipboard(_app)) throw new Exception("클립보드를 열지 못했습니다.");
            try
            {
                Native.EmptyClipboard();
                if (Native.SetClipboardData(8, mem) == IntPtr.Zero) throw new Exception("클립보드에 넣지 못했습니다.");
                mem = IntPtr.Zero;
            }
            finally
            {
                Native.CloseClipboard();
                if (mem != IntPtr.Zero) Native.GlobalFree(mem);
            }
        }
        finally
        {
            bmp.UnlockBits(data);
        }
    }

    static void FitView()
    {
        if (_app == IntPtr.Zero || _viewHost == IntPtr.Zero) return;
        Native.GetClientRect(_app, out var outer);
        var height = Math.Max(0, outer.bottom);
        Native.MoveWindow(_viewHost, 0, 0, Math.Max(0, outer.right), height, true);
        if (_controller == null) return;
        Native.GetClientRect(_viewHost, out var inner);
        _controller.Bounds = new System.Drawing.Rectangle(0, 0, Math.Max(0, inner.right), Math.Max(0, inner.bottom));
    }

    static string WithCompanyFlag(string html, string filesJson, string tab = "")
    {
        const string token = "window.__WB_FILES__=[]";
        var open = tab.Length == 0 ? "" : ";window.__WB_TAB__=" + Json(tab);
        var pace = _paceHand.Length == 0 ? "" : ";window.__PACE_HAND__=" + _paceHand;
        return html.Replace(token, "window.__WB_FILES__=" + filesJson + ";window.__COMPANY_PC__=true" + open + pace + PanelBoot() + FolderBoot() + UiBoot());
    }

    static string LocalPanelPath()
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        return Path.Combine(dir, "panel.json");
    }

    static string ShareDir()
    {
        if (_panelDir.Length > 0) return _panelDir;
        var exe = Environment.ProcessPath ?? "";
        if (exe.Length > 0 && IsRemote(exe)) return Path.GetDirectoryName(exe) ?? "";
        return "";
    }

    static string PanelPath()
    {
        var share = ShareDir();
        if (share.Length > 0) return Path.Combine(share, "제어판.json");
        var exeDir = Path.GetDirectoryName(Environment.ProcessPath ?? "");
        if (!string.IsNullOrEmpty(exeDir)) return Path.Combine(exeDir, "제어판.json");
        return LocalPanelPath();
    }

    static void SeedSharedPanel()
    {
        var shared = PanelPath();
        var local = LocalPanelPath();
        if (string.Equals(shared, local, StringComparison.OrdinalIgnoreCase)) return;
        if (File.Exists(shared) || !File.Exists(local)) return;
        try { TryWritePanel(shared, File.ReadAllText(local, Encoding.UTF8)); } catch { }
    }

    static bool TryWritePanel(string path, string body)
    {
        try
        {
            var dir = Path.GetDirectoryName(path);
            if (string.IsNullOrEmpty(dir)) return false;
            Directory.CreateDirectory(dir);
            var temp = path + ".new";
            File.WriteAllText(temp, body, new UTF8Encoding(false));
            File.Copy(temp, path, true);
            try { File.Delete(temp); } catch { }
            return true;
        }
        catch
        {
            return false;
        }
    }

    static void SavePanel(string body)
    {
        if (body.Length == 0 || body.Length > 400_000) return;
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return;
        }
        catch
        {
            return;
        }
        var path = PanelPath();
        var wrote = TryWritePanel(path, body);
        var local = LocalPanelPath();
        if (!string.Equals(path, local, StringComparison.OrdinalIgnoreCase))
            wrote = TryWritePanel(local, body) || wrote;
        if (!wrote)
        {
            if (!_panelWarned)
            {
                _panelWarned = true;
                Native.MessageBoxW(_app, "제어판 내용을 저장하지 못했습니다.\n" + path, "센터 생산성", 0);
            }
            return;
        }
        _seenPanel = body;
        System.Threading.Tasks.Task.Run(() => PostPanel(body));
    }

    const string PanelUrl = "https://osan.grok.me/api/panel";

    static void PostPanel(string body)
    {
        if (body.Length < 2 || body.Length > 400_000) return;
        try
        {
            using var http = new HttpClient(new SocketsHttpHandler { ConnectTimeout = TimeSpan.FromSeconds(8), UseProxy = true })
            {
                Timeout = TimeSpan.FromSeconds(20),
            };
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CenterProductivity");
            using var content = new StringContent(body, Encoding.UTF8, "application/json");
            using var response = http.PostAsync(PanelUrl, content).GetAwaiter().GetResult();
        }
        catch { }
    }

    static void PullRemotePanel()
    {
        try
        {
            var local = ReadPanelText();
            if (local.Length > 0) PostPanel(local);
            using var http = new HttpClient(new SocketsHttpHandler { ConnectTimeout = TimeSpan.FromSeconds(8), UseProxy = true })
            {
                Timeout = TimeSpan.FromSeconds(20),
            };
            http.DefaultRequestHeaders.UserAgent.ParseAdd("CenterProductivity");
            var remote = http.GetStringAsync(PanelUrl + "?t=" + DateTime.UtcNow.Ticks).GetAwaiter().GetResult().Trim();
            if (remote.Length < 20 || remote.Length > 2_000_000 || remote[0] != '{') return;
            if (!remote.Contains("\"frozenLocs\"") && !remote.Contains("\"layouts\"") && !remote.Contains("\"sites\"") && !remote.Contains("\"codes\"")) return;
            if (remote == local) return;
            var path = PanelPath();
            if (!TryWritePanel(path, remote)) return;
            var localPath = LocalPanelPath();
            if (!string.Equals(path, localPath, StringComparison.OrdinalIgnoreCase)) TryWritePanel(localPath, remote);
            _seenPanel = "";
        }
        catch { }
    }

    static long PanelStamp(string text)
    {
        try
        {
            using var doc = JsonDocument.Parse(text);
            if (doc.RootElement.TryGetProperty("savedAt", out var stamp) && stamp.TryGetInt64(out var ticks)) return ticks;
        }
        catch { }
        return 0;
    }

    static string ReadPanelText()
    {
        var paths = new List<string> { PanelPath() };
        var local = LocalPanelPath();
        if (!string.Equals(paths[0], local, StringComparison.OrdinalIgnoreCase)) paths.Add(local);
        string best = "";
        long bestStamp = -1;
        var bestTime = DateTime.MinValue;
        foreach (var path in paths)
        {
            try
            {
                if (!File.Exists(path)) continue;
                using var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                using var reader = new StreamReader(stream, Encoding.UTF8);
                var text = reader.ReadToEnd().Trim().TrimStart('\uFEFF');
                if (text.Length == 0 || text.Length > 2_000_000 || text[0] != '{') continue;
                using var doc = JsonDocument.Parse(text);
                if (doc.RootElement.ValueKind != JsonValueKind.Object) continue;
                var stamp = PanelStamp(text);
                var written = File.GetLastWriteTimeUtc(path);
                if (stamp > bestStamp || (stamp == bestStamp && written > bestTime))
                {
                    best = text;
                    bestStamp = stamp;
                    bestTime = written;
                }
            }
            catch { }
        }
        return best;
    }

    static void StartPanelWatch()
    {
        var ui = SynchronizationContext.Current;
        if (ui != null) _ui = ui;
        if (ui == null || _panelTimer != null) return;
        _seenPanel = ReadPanelText();
        System.Threading.Tasks.Task.Run(PullRemotePanel);
        _panelTimer = new System.Threading.Timer(_ => ui.Post(__ => PushPanel(), null), null, 2500, 2500);
    }

    static void PushPanel()
    {
        if (_web == null) return;
        var text = ReadPanelText();
        if (text.Length == 0 || text == _seenPanel) return;
        _seenPanel = text;
        try
        {
            _web.PostWebMessageAsString("{\"type\":\"panel\",\"state\":" + text + "}");
        }
        catch { }
    }

    static string PanelBoot()
    {
        try
        {
            var text = ReadPanelText();
            if (text.Length == 0) return "";
            _seenPanel = text;
            var safe = text
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\r", "\\r")
                .Replace("\n", "\\n")
                .Replace("<", "\\u003c")
                .Replace("\u2028", "\\u2028")
                .Replace("\u2029", "\\u2029");
            return ";window.__PANEL__=JSON.parse(\"" + safe + "\")";
        }
        catch
        {
            return "";
        }
    }

    static readonly string[] FolderKeys = ["work", "roster", "ship", "stock", "wrong"];
    static Dictionary<string, string> _folders = new(StringComparer.Ordinal);

    static string FoldersPath()
    {
        return Path.Combine(Path.GetDirectoryName(PanelPath()) ?? "", "지정폴더.json");
    }

    static void LoadFolders()
    {
        _folders = new Dictionary<string, string>(StringComparer.Ordinal);
        try
        {
            var path = FoldersPath();
            if (!File.Exists(path)) return;
            using var doc = JsonDocument.Parse(File.ReadAllText(path, Encoding.UTF8));
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return;
            foreach (var key in FolderKeys)
            {
                if (!doc.RootElement.TryGetProperty(key, out var value)) continue;
                var dir = value.GetString()?.Trim() ?? "";
                if (dir.Length is > 0 and < 400) _folders[key] = dir;
            }
        }
        catch { }
    }

    static void SaveFolders()
    {
        try
        {
            var path = FoldersPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                foreach (var key in FolderKeys)
                {
                    _folders.TryGetValue(key, out var dir);
                    writer.WriteString(key, dir ?? "");
                }
                writer.WriteEndObject();
            }
            File.WriteAllText(path, Encoding.UTF8.GetString(stream.ToArray()), new UTF8Encoding(false));
        }
        catch { }
    }

    static bool FolderKey(string key) => FolderKeys.Contains(key);

    static void PushFolder(string key)
    {
        if (_web == null || !FolderKey(key)) return;
        _folders.TryGetValue(key, out var dir);
        try { _web.PostWebMessageAsString("{\"type\":\"folder\",\"key\":" + Json(key) + ",\"path\":" + Json(dir ?? "") + "}"); } catch { }
    }

    static void SetFolder(string key, string path)
    {
        if (!FolderKey(key)) return;
        LoadFolders();
        var dir = path.Trim();
        if (dir.Length >= 400 || dir.IndexOfAny(['<', '>', '"']) >= 0) return;
        if (dir.Length == 0) _folders.Remove(key);
        else _folders[key] = dir;
        SaveFolders();
        PushFolder(key);
    }

    static void PickFolder(string key)
    {
        if (!FolderKey(key) || _web == null) return;
        var title = key switch
        {
            "work" => "작업 내역 폴더",
            "roster" => "근태표 폴더",
            "ship" => "배송상품군별 폴더",
            "stock" => "수불장 폴더",
            "wrong" => "오출내역 폴더",
            _ => "폴더",
        };
        LoadFolders();
        var start = _folders.TryGetValue(key, out var saved) && Directory.Exists(saved) ? saved : ShareDir();
        var picked = BrowseFolder(_app != IntPtr.Zero ? _app : _window, title + "를 고르세요", start);
        if (picked.Length == 0) return;
        SetFolder(key, picked);
    }

    static string BrowseFolder(IntPtr owner, string title, string start)
    {
        var dialog = (Native.IFileOpenDialog)new Native.FileOpenDialog();
        try
        {
            dialog.GetOptions(out var options);
            dialog.SetOptions(options | 0x20 | 0x40 | 0x800 | 0x8);
            dialog.SetTitle(title);
            dialog.SetOkButtonLabel("폴더 선택");
            if (start.Length > 0 && Directory.Exists(start))
            {
                var iid = Native.ShellItemId;
                if (Native.SHCreateItemFromParsingName(start, IntPtr.Zero, ref iid, out var folder) == 0 && folder != null)
                    dialog.SetFolder(folder);
            }
            if (dialog.Show(owner) != 0) return "";
            dialog.GetResult(out var item);
            item.GetDisplayName(0x80058000, out var ptr);
            try { return Marshal.PtrToStringUni(ptr) ?? ""; }
            finally { if (ptr != IntPtr.Zero) Native.CoTaskMemFree(ptr); }
        }
        finally
        {
            Marshal.ReleaseComObject(dialog);
        }
    }

    static IEnumerable<string> ExcelFiles(string root)
    {
        var pending = new Stack<string>();
        pending.Push(root);
        while (pending.Count > 0)
        {
            var dir = pending.Pop();
            IEnumerable<string> children;
            try { children = Directory.EnumerateDirectories(dir); }
            catch { continue; }
            foreach (var child in children) pending.Push(child);
            IEnumerable<string> files;
            try { files = Directory.EnumerateFiles(dir); }
            catch { continue; }
            foreach (var file in files)
            {
                var name = Path.GetFileName(file);
                if (name.StartsWith("~$", StringComparison.Ordinal)) continue;
                var ext = Path.GetExtension(file);
                if (ext.Equals(".xlsx", StringComparison.OrdinalIgnoreCase) || ext.Equals(".xlsm", StringComparison.OrdinalIgnoreCase) || ext.Equals(".xls", StringComparison.OrdinalIgnoreCase))
                    yield return file;
            }
        }
    }

    static readonly string[] Weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

    sealed class ArchiveOut
    {
        public string Period = "";
        public string Sub = "";
        public string Sort = "";
        public string Dpt = "";
        public string Center = "";
        public int Line;
        public int Planned;
        public int Done;
        public double Hours;
        public long? First;
        public long? Last;
        public string Date = "";
        public string Kind = "";
    }

    sealed class WorkAgg
    {
        public int Planned;
        public int Done;
        public long? First;
        public long? Last;
        public void Add(WorkJob job)
        {
            Planned++;
            if (job.At is not long at) return;
            Done++;
            if (First == null || at < First) First = at;
            if (Last == null || at > Last) Last = at;
        }
    }

    const int WorkCacheVersion = 1;

    sealed class WorkCacheHit
    {
        public string Name = "";
        public long Length;
        public long Ticks;
        public string Date = "";
        public string Kind = "";
        public List<ArchiveOut> Rows = [];
    }

    static string WorkCachePath()
    {
        return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity", "work-summary-cache.json");
    }

    static Dictionary<string, WorkCacheHit> LoadWorkCache(string dir, int year)
    {
        var map = new Dictionary<string, WorkCacheHit>(StringComparer.OrdinalIgnoreCase);
        try
        {
            var path = WorkCachePath();
            if (!File.Exists(path)) return map;
            using var doc = JsonDocument.Parse(File.ReadAllText(path, Encoding.UTF8));
            if (!doc.RootElement.TryGetProperty("version", out var version) || version.GetInt32() != WorkCacheVersion) return map;
            if (!doc.RootElement.TryGetProperty("folders", out var folders)) return map;
            var want = Path.GetFullPath(dir).TrimEnd('\\');
            foreach (var folder in folders.EnumerateArray())
            {
                var folderPath = folder.TryGetProperty("path", out var pathValue) ? pathValue.GetString() ?? "" : "";
                var folderYear = folder.TryGetProperty("year", out var yearValue) ? yearValue.GetInt32() : 0;
                if (folderYear != year || folderPath.Length == 0) continue;
                if (!string.Equals(Path.GetFullPath(folderPath).TrimEnd('\\'), want, StringComparison.OrdinalIgnoreCase)) continue;
                if (!folder.TryGetProperty("files", out var files)) continue;
                foreach (var file in files.EnumerateArray())
                {
                    var hit = new WorkCacheHit
                    {
                        Name = file.TryGetProperty("name", out var nameValue) ? nameValue.GetString() ?? "" : "",
                        Length = file.TryGetProperty("length", out var lengthValue) ? lengthValue.GetInt64() : 0,
                        Ticks = file.TryGetProperty("ticks", out var ticksValue) ? ticksValue.GetInt64() : 0,
                        Date = file.TryGetProperty("date", out var dateValue) ? dateValue.GetString() ?? "" : "",
                        Kind = file.TryGetProperty("kind", out var kindValue) ? kindValue.GetString() ?? "" : "",
                    };
                    if (file.TryGetProperty("rows", out var rows))
                    {
                        foreach (var row in rows.EnumerateArray()) hit.Rows.Add(ReadCacheRow(row));
                    }
                    if (hit.Name.Length > 0 && hit.Rows.Count > 0) map[hit.Name] = hit;
                }
            }
        }
        catch { }
        return map;
    }

    static ArchiveOut ReadCacheRow(JsonElement row)
    {
        var item = new ArchiveOut
        {
            Period = row.TryGetProperty("period", out var period) ? period.GetString() ?? "" : "",
            Sub = row.TryGetProperty("sub", out var sub) ? sub.GetString() ?? "" : "",
            Sort = row.TryGetProperty("sort", out var sort) ? sort.GetString() ?? "" : "",
            Dpt = row.TryGetProperty("dpt", out var dpt) ? dpt.GetString() ?? "" : "",
            Center = row.TryGetProperty("center", out var center) ? center.GetString() ?? "" : "",
            Line = row.TryGetProperty("line", out var line) ? line.GetInt32() : 0,
            Planned = row.TryGetProperty("planned", out var planned) ? planned.GetInt32() : 0,
            Done = row.TryGetProperty("done", out var done) ? done.GetInt32() : 0,
            Hours = row.TryGetProperty("hours", out var hours) ? hours.GetDouble() : 0,
            Date = row.TryGetProperty("date", out var date) ? date.GetString() ?? "" : "",
            Kind = row.TryGetProperty("kind", out var kind) ? kind.GetString() ?? "" : "",
        };
        if (row.TryGetProperty("first", out var first) && first.ValueKind == JsonValueKind.Number) item.First = first.GetInt64();
        if (row.TryGetProperty("last", out var last) && last.ValueKind == JsonValueKind.Number) item.Last = last.GetInt64();
        return item;
    }

    static void WriteCacheRow(Utf8JsonWriter writer, ArchiveOut row)
    {
        writer.WriteStartObject();
        writer.WriteString("period", row.Period);
        writer.WriteString("sub", row.Sub);
        writer.WriteString("sort", row.Sort);
        writer.WriteString("dpt", row.Dpt);
        writer.WriteString("center", row.Center);
        writer.WriteNumber("line", row.Line);
        writer.WriteNumber("planned", row.Planned);
        writer.WriteNumber("done", row.Done);
        writer.WriteNumber("hours", row.Hours);
        if (row.First is long first) writer.WriteNumber("first", first); else writer.WriteNull("first");
        if (row.Last is long last) writer.WriteNumber("last", last); else writer.WriteNull("last");
        writer.WriteString("date", row.Date);
        writer.WriteString("kind", row.Kind);
        writer.WriteEndObject();
    }

    static void SaveWorkCache(string dir, int year, List<WorkCacheHit> files)
    {
        try
        {
            var path = WorkCachePath();
            var folderDir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(folderDir)) Directory.CreateDirectory(folderDir);
            JsonElement? others = null;
            try
            {
                if (File.Exists(path))
                {
                    using var existing = JsonDocument.Parse(File.ReadAllText(path, Encoding.UTF8));
                    if (existing.RootElement.TryGetProperty("version", out var version) && version.GetInt32() == WorkCacheVersion && existing.RootElement.TryGetProperty("folders", out var folders))
                        others = folders.Clone();
                }
            }
            catch { }
            var want = Path.GetFullPath(dir).TrimEnd('\\');
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                writer.WriteNumber("version", WorkCacheVersion);
                writer.WritePropertyName("folders");
                writer.WriteStartArray();
                var keptFolders = 0;
                if (others is JsonElement previous)
                {
                    foreach (var folder in previous.EnumerateArray())
                    {
                        var folderPath = folder.TryGetProperty("path", out var pathValue) ? pathValue.GetString() ?? "" : "";
                        var folderYear = folder.TryGetProperty("year", out var yearValue) ? yearValue.GetInt32() : 0;
                        if (folderPath.Length == 0) continue;
                        string full;
                        try { full = Path.GetFullPath(folderPath).TrimEnd('\\'); }
                        catch { continue; }
                        if (folderYear == year && string.Equals(full, want, StringComparison.OrdinalIgnoreCase)) continue;
                        if (keptFolders >= 5) continue;
                        writer.WriteRawValue(folder.GetRawText());
                        keptFolders++;
                    }
                }
                writer.WriteStartObject();
                writer.WriteString("path", want);
                writer.WriteNumber("year", year);
                writer.WritePropertyName("files");
                writer.WriteStartArray();
                foreach (var file in files)
                {
                    writer.WriteStartObject();
                    writer.WriteString("name", file.Name);
                    writer.WriteNumber("length", file.Length);
                    writer.WriteNumber("ticks", file.Ticks);
                    writer.WriteString("date", file.Date);
                    writer.WriteString("kind", file.Kind);
                    writer.WritePropertyName("rows");
                    writer.WriteStartArray();
                    foreach (var row in file.Rows) WriteCacheRow(writer, row);
                    writer.WriteEndArray();
                    writer.WriteEndObject();
                }
                writer.WriteEndArray();
                writer.WriteEndObject();
                writer.WriteEndArray();
                writer.WriteEndObject();
            }
            var temp = path + ".tmp";
            File.WriteAllBytes(temp, stream.ToArray());
            File.Copy(temp, path, true);
            try { File.Delete(temp); } catch { }
        }
        catch { }
    }

    static void ApplyFileRows(List<ArchiveOut> rows, string date, string kind, List<ArchiveOut> fileRows)
    {
        rows.RemoveAll(row => row.Date == date && row.Kind == kind);
        rows.AddRange(fileRows);
    }

    static void ReadWorkFolder(string dir, int year)
    {
        var trace = ReadTraceOn();
        var all = trace ? System.Diagnostics.Stopwatch.StartNew() : null;
        long listMs = 0;
        long readMs = 0;
        var ok = 0;
        var fail = 0;
        var fileCount = 0;
        var cacheHits = 0;
        try
        {
            if (trace) BeginVerify("구분=폴더 폴더=" + dir + " 연도=" + year.ToString(System.Globalization.CultureInfo.InvariantCulture));
            PostWeb("{\"type\":\"archive-status\",\"text\":\"폴더 찾는 중\"}");
            var chosen = new List<(FileInfo Info, string Date, string Kind)>();
            var listSw = trace ? System.Diagnostics.Stopwatch.StartNew() : null;
            foreach (var path in ExcelFiles(dir))
            {
                var info = new FileInfo(path);
                if (info.Length <= 0) continue;
                var meta = WorkFileMeta(info.Name, year);
                if (meta == null) continue;
                chosen.Add((info, meta.Value.Date, meta.Value.Kind));
            }
            chosen.Sort((a, b) => string.Compare(a.Info.Name, b.Info.Name, StringComparison.OrdinalIgnoreCase));
            if (listSw != null)
            {
                listSw.Stop();
                listMs = listSw.ElapsedMilliseconds;
            }
            fileCount = chosen.Count;
            var cache = LoadWorkCache(dir, year);
            var pending = new List<int>();
            var preview = new List<ArchiveOut>();
            for (var index = 0; index < chosen.Count; index++)
            {
                var item = chosen[index];
                try { item.Info.Refresh(); } catch { }
                if (cache.TryGetValue(item.Info.FullName, out var hit) && hit.Length == item.Info.Length && hit.Ticks == item.Info.LastWriteTimeUtc.Ticks && hit.Date == item.Date && hit.Kind == item.Kind && hit.Rows.Count > 0)
                {
                    ApplyFileRows(preview, item.Date, item.Kind, hit.Rows);
                    cacheHits++;
                }
                else pending.Add(index);
            }
            if (preview.Count > 0 && pending.Count > 0) PostArchiveRows(preview, []);
            var rows = new List<ArchiveOut>();
            var kept = new List<WorkCacheHit>();
            var notes = new List<string>();
            var readSw = trace && pending.Count > 0 ? System.Diagnostics.Stopwatch.StartNew() : null;
            var readCount = 0;
            for (var index = 0; index < chosen.Count; index++)
            {
                var item = chosen[index];
                try { item.Info.Refresh(); } catch { }
                var length = item.Info.Length;
                var ticks = item.Info.LastWriteTimeUtc.Ticks;
                if (cache.TryGetValue(item.Info.FullName, out var hit) && hit.Length == length && hit.Ticks == ticks && hit.Date == item.Date && hit.Kind == item.Kind && hit.Rows.Count > 0)
                {
                    ApplyFileRows(rows, item.Date, item.Kind, hit.Rows);
                    kept.Add(hit);
                    if (trace) ok++;
                    continue;
                }
                readCount++;
                PostWeb($"{{\"type\":\"archive-status\",\"text\":{Json($"{readCount}/{pending.Count} {item.Info.Name}")}}}");
                var centers = new Dictionary<string, List<WorkJob>>(StringComparer.Ordinal);
                try
                {
                    if (!TryReadWork(item.Info.FullName, centers, false))
                    {
                        notes.Add($"{item.Info.Name}: 작업 행을 찾지 못했습니다.");
                        if (trace) fail++;
                        continue;
                    }
                }
                catch (Exception ex)
                {
                    notes.Add($"{item.Info.Name}: {ex.Message}");
                    if (trace) fail++;
                    continue;
                }
                var fileRows = SummarizeWork(item.Date, item.Kind, centers);
                if (fileRows.Count == 0)
                {
                    notes.Add($"{item.Info.Name}: 작업 행을 찾지 못했습니다.");
                    if (trace) fail++;
                    continue;
                }
                ApplyFileRows(rows, item.Date, item.Kind, fileRows);
                if (trace) ok++;
                try { item.Info.Refresh(); } catch { }
                if (item.Info.Length != length || item.Info.LastWriteTimeUtc.Ticks != ticks)
                {
                    notes.Add($"{item.Info.Name}: 저장 중이라 다음에 다시 확인합니다.");
                    continue;
                }
                kept.Add(new WorkCacheHit { Name = item.Info.FullName, Length = length, Ticks = ticks, Date = item.Date, Kind = item.Kind, Rows = fileRows });
            }
            if (readSw != null)
            {
                readSw.Stop();
                readMs = readSw.ElapsedMilliseconds;
            }
            SaveWorkCache(dir, year, kept);
            if (all != null)
            {
                all.Stop();
                TraceLine("종류=폴더\t폴더=" + dir + "\t파일수=" + fileCount.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t저장됨=" + cacheHits.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t다시읽음=" + readCount.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t성공=" + ok.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t실패=" + fail.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t목록밀리초=" + listMs.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t읽기밀리초=" + readMs.ToString(System.Globalization.CultureInfo.InvariantCulture) + "\t전체밀리초=" + all.ElapsedMilliseconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            PostArchiveRows(rows, notes);
        }
        catch
        {
            PostWeb("{\"type\":\"archive-status\",\"text\":\"\"}");
        }
        finally
        {
            if (trace) EndVerify();
        }
    }

    static (string Date, string Kind)? WorkFileMeta(string name, int year)
    {
        var stem = Path.GetFileNameWithoutExtension(name);
        var kind = System.Text.RegularExpressions.Regex.IsMatch(stem, @"FF\s*1(?!\d)", System.Text.RegularExpressions.RegexOptions.IgnoreCase)
            ? "FF1"
            : System.Text.RegularExpressions.Regex.IsMatch(stem, @"FF\s*2(?!\d)", System.Text.RegularExpressions.RegexOptions.IgnoreCase) ? "FF2" : "";
        if (kind.Length == 0 || year < 2000) return null;
        var full = System.Text.RegularExpressions.Regex.Match(stem, @"(20\d{2})[-_.\/년\s]*(0?[1-9]|1[0-2])[-_.\/월\s]*([0-2]?\d|3[01])(?!\d)");
        if (full.Success) return (IsoDate(full.Groups[1].Value, full.Groups[2].Value, full.Groups[3].Value), kind);
        var words = System.Text.RegularExpressions.Regex.Match(stem, @"(0?[1-9]|1[0-2])\s*월\s*([0-2]?\d|3[01])\s*일");
        if (words.Success) return (IsoDate(year.ToString(), words.Groups[1].Value, words.Groups[2].Value), kind);
        var split = System.Text.RegularExpressions.Regex.Match(stem, @"(?:^|[^0-9])(0?[1-9]|1[0-2])[-_.\/]([0-2]?\d|3[01])(?!\d)");
        if (split.Success) return (IsoDate(year.ToString(), split.Groups[1].Value, split.Groups[2].Value), kind);
        var compact = System.Text.RegularExpressions.Regex.Match(stem, @"(?:^|[^0-9])(0[1-9]|1[0-2])([0-2]\d|3[01])(?!\d)");
        if (compact.Success) return (IsoDate(year.ToString(), compact.Groups[1].Value, compact.Groups[2].Value), kind);
        return null;
    }

    static string IsoDate(string year, string month, string day)
    {
        return $"{year}-{month.PadLeft(2, '0')}-{day.PadLeft(2, '0')}";
    }

    static List<ArchiveOut> SummarizeWork(string date, string kind, Dictionary<string, List<WorkJob>> centers)
    {
        var map = new Dictionary<(string Dpt, string Center, int Line), WorkAgg>();
        foreach (var center in centers)
        {
            foreach (var job in center.Value)
            {
                var dpt = WorkDpt(job.Route, kind);
                if (dpt.Length == 0) continue;
                AddAgg(map, (dpt, center.Key, 0), job);
                if (job.Line is double raw && raw >= 1 && raw <= 12 && Math.Abs(raw - Math.Round(raw)) < 0.001)
                    AddAgg(map, (dpt, center.Key, (int)Math.Round(raw)), job);
            }
        }
        var when = DateTime.ParseExact(date, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
        var period = $"{when.Month}월 {when.Day}일";
        var sub = Weekdays[(int)when.DayOfWeek];
        var rows = new List<ArchiveOut>();
        foreach (var item in map)
        {
            var agg = item.Value;
            if (agg.Planned == 0) continue;
            var hours = agg.First is long first && agg.Last is long last ? (last - first) / 3600000d : 0;
            rows.Add(new ArchiveOut
            {
                Period = period,
                Sub = sub,
                Sort = item.Key.Line == 0 ? date : $"{date}-{item.Key.Line}",
                Dpt = item.Key.Dpt,
                Center = item.Key.Center,
                Line = item.Key.Line,
                Planned = agg.Planned,
                Done = agg.Done,
                Hours = hours,
                First = agg.First,
                Last = agg.Last,
                Date = date,
                Kind = kind,
            });
        }
        return rows;
    }

    static void AddAgg(Dictionary<(string Dpt, string Center, int Line), WorkAgg> map, (string Dpt, string Center, int Line) key, WorkJob job)
    {
        if (!map.TryGetValue(key, out var agg)) map[key] = agg = new WorkAgg();
        agg.Add(job);
    }

    static string WorkDpt(string route, string kind)
    {
        var text = route.Trim();
        var known = "";
        if (text.Length > 0 && text.All(char.IsDigit) && int.TryParse(text, out var code))
        {
            if (code is >= 100 and <= 199) known = "유제 냉장";
            else if (code is >= 200 and <= 299) known = "FF2";
            else if (code is >= 300 and <= 399) known = "FF1";
        }
        if (kind == "FF1") return known is "유제 냉장" or "FF2" ? "" : "FF1";
        return known is "유제 냉장" or "FF2" ? known : "";
    }

    static void PostArchiveRows(List<ArchiveOut> rows, List<string> notes)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("type", "archive-rows");
            writer.WriteString("note", string.Join(" ", notes));
            writer.WritePropertyName("rows");
            writer.WriteStartArray();
            foreach (var row in rows)
            {
                writer.WriteStartObject();
                writer.WriteString("period", row.Period);
                writer.WriteString("sub", row.Sub);
                writer.WriteString("sort", row.Sort);
                writer.WriteString("dpt", row.Dpt);
                writer.WriteString("center", row.Center);
                writer.WriteNumber("line", row.Line);
                writer.WriteNumber("days", 1);
                writer.WriteNumber("planned", row.Planned);
                writer.WriteNumber("done", row.Done);
                writer.WriteNumber("left", row.Planned - row.Done);
                writer.WriteNumber("rate", row.Planned > 0 ? (double)row.Done / row.Planned : 0);
                writer.WriteNumber("hours", row.Hours);
                writer.WriteNumber("perHour", row.Hours > 0 ? row.Done / row.Hours : 0);
                if (row.First is long first) writer.WriteNumber("first", first); else writer.WriteNull("first");
                if (row.Last is long last) writer.WriteNumber("last", last); else writer.WriteNull("last");
                writer.WriteEndObject();
            }
            writer.WriteEndArray();
            writer.WriteEndObject();
        }
        PostWeb(Encoding.UTF8.GetString(stream.ToArray()));
    }

    static void ReadFolder(string key, int year = 2026)
    {
        if (!FolderKey(key) || _web == null) return;
        LoadFolders();
        if (!_folders.TryGetValue(key, out var dir) || dir.Length == 0 || !Directory.Exists(dir)) return;
        if (key == "work")
        {
            ReadWorkFolder(dir, year);
            return;
        }
        try
        {
            var files = ExcelFiles(dir).Select(file => new FileInfo(file)).Where(info => info.Length > 0).ToList();
            if (files.Count == 0) return;
            if (key == "stock")
            {
                var file = files.OrderByDescending(info => info.LastWriteTimeUtc).First();
                var b64 = Convert.ToBase64String(ReadShared(file.FullName));
                PostWeb($"{{\"type\":\"stock-file\",\"name\":{Json(file.Name)},\"b64\":\"{b64}\"}}");
                return;
            }
            var ordered = files.OrderBy(info => info.Name, StringComparer.OrdinalIgnoreCase).ToList();
            var typeName = key == "work" ? "archive-files" : key == "ship" ? "ledger" : key == "roster" ? "roster-files" : "oship-files";
            var batch = new List<string>();
            var size = 0;
            var first = true;
            void Flush()
            {
                if (batch.Count == 0 || _web == null) return;
                var reset = first ? "true" : "false";
                first = false;
                PostWeb($"{{\"type\":\"{typeName}\",\"reset\":{reset},\"files\":[{string.Join(",", batch)}]}}");
                batch.Clear();
                size = 0;
            }
            foreach (var info in ordered)
            {
                var b64 = Convert.ToBase64String(ReadShared(info.FullName));
                if (size + b64.Length > 12_000_000 && batch.Count > 0) Flush();
                batch.Add($"{{\"name\":{Json(info.Name)},\"b64\":\"{b64}\"}}");
                size += b64.Length;
            }
            Flush();
        }
        catch { }
    }

    static void PostWeb(string text)
    {
        void Send()
        {
            try { _web?.PostWebMessageAsString(text); } catch { }
        }
        if (_ui != null) _ui.Post(__ => Send(), null);
        else Send();
    }

    static string UiPath()
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CenterProductivity");
        return Path.Combine(dir, "ui.json");
    }

    static bool OkUi(string value) => value is "ios" or "windows" or "chrome" or "naver";

    static bool OkColor(string value) => value is "plain" or "field" or "puff" or "pop" or "sky" or "naver";

    static void SaveUi(string body)
    {
        var bar = body.IndexOf('|');
        var ui = bar >= 0 ? body[..bar] : body;
        var color = bar >= 0 ? body[(bar + 1)..] : "plain";
        if (!OkUi(ui) || !OkColor(color) || body.Length > 40) return;
        try
        {
            var path = UiPath();
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, "{\"ui\":\"" + ui + "\",\"color\":\"" + color + "\"}");
        }
        catch { }
    }

    static string UiBoot()
    {
        try
        {
            using var doc = JsonDocument.Parse(File.ReadAllText(UiPath()));
            var ui = doc.RootElement.TryGetProperty("ui", out var uiValue) ? uiValue.GetString() ?? "" : "";
            var color = doc.RootElement.TryGetProperty("color", out var colorValue) ? colorValue.GetString() ?? "" : "";
            if (!OkUi(ui) || !OkColor(color)) return "";
            return ";window.__UI__={ui:\"" + ui + "\",color:\"" + color + "\"}";
        }
        catch
        {
            return "";
        }
    }

    static string FolderBoot()
    {
        LoadFolders();
        try
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                foreach (var key in FolderKeys)
                {
                    _folders.TryGetValue(key, out var dir);
                    writer.WriteString(key, dir ?? "");
                }
                writer.WriteEndObject();
            }
            var json = Encoding.UTF8.GetString(stream.ToArray());
            return ";window.__FOLDERS__=" + json;
        }
        catch
        {
            return "";
        }
    }

    static void LaunchHtml(string html)
    {
        if (_web != null)
        {
            EnsureHost();
            var name = "app-" + DateTime.UtcNow.Ticks + ".html";
            var page = Path.Combine(HostDir(), name);
            File.WriteAllText(page, html, new UTF8Encoding(false));
            Native.ShowWindow(_window, 0);
            _web.Navigate("https://centerfiles.local/" + name);
            RemoveOldHostPages(HostDir(), page);
            Native.ShowWindow(_app, 5);
            Native.SetForegroundWindow(_app);
            return;
        }
        var dir = EdgePageDir();
        Directory.CreateDirectory(dir);
        var outFile = Path.Combine(dir, "view-" + DateTime.Now.Ticks + ".html");
        File.WriteAllText(outFile, html, new UTF8Encoding(false));
        RemoveOldEdgePages(outFile);
        var edge = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
        }.FirstOrDefault(File.Exists);
        var appArg = "--app=\"" + outFile + "\"";
        if (edge != null)
            Process.Start(new ProcessStartInfo(edge, appArg) { UseShellExecute = true });
        else
            Process.Start(new ProcessStartInfo(outFile) { UseShellExecute = true });
    }

    static string Json(string value) => "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"";
}

internal static class Native
{
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern ushort RegisterClassW(ref WNDCLASSW lpWndClass);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr CreateWindowExW(int dwExStyle, string lpClassName, string lpWindowName, int dwStyle, int x, int y, int nWidth, int nHeight, IntPtr hWndParent, IntPtr hMenu, IntPtr hInstance, IntPtr lpParam);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool UpdateWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool DestroyWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetMessageW(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);
    [DllImport("user32.dll")] public static extern bool TranslateMessage(ref MSG lpMsg);
    [DllImport("user32.dll")] public static extern IntPtr DispatchMessageW(ref MSG lpMsg);
    [DllImport("user32.dll")] public static extern void PostQuitMessage(int nExitCode);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr DefWindowProcW(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern bool SetWindowTextW(IntPtr hWnd, string lpString);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr SendMessageW(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int MessageBoxW(IntPtr hWnd, string text, string caption, uint type);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr LoadCursorW(IntPtr hInstance, IntPtr lpCursorName);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr GetModuleHandleW(string? lpModuleName);
    [DllImport("gdi32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr CreateFontW(int cHeight, int cWidth, int cEscapement, int cOrientation, int cWeight, uint bItalic, uint bUnderline, uint bStrikeOut, uint iCharSet, uint iOutPrecision, uint iClipPrecision, uint iQuality, uint iPitchAndFamily, string pszFaceName);
    [DllImport("gdi32.dll")] public static extern IntPtr GetStockObject(int obj);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool InvalidateRect(IntPtr hWnd, IntPtr lpRect, bool bErase);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern int SetBkMode(IntPtr hdc, int mode);
    [DllImport("gdi32.dll")] public static extern uint SetTextColor(IntPtr hdc, uint color);
    [DllImport("gdi32.dll")] public static extern uint SetBkColor(IntPtr hdc, uint color);
    [DllImport("gdi32.dll")] public static extern IntPtr CreateSolidBrush(uint color);
    [DllImport("gdi32.dll")] public static extern IntPtr CreatePen(int iStyle, int cWidth, uint color);
    [DllImport("gdi32.dll")] public static extern IntPtr SelectObject(IntPtr hdc, IntPtr obj);
    [DllImport("gdi32.dll")] public static extern bool DeleteObject(IntPtr obj);
    [DllImport("gdi32.dll")] public static extern bool RoundRect(IntPtr hdc, int left, int top, int right, int bottom, int ellipseWidth, int ellipseHeight);
    [DllImport("user32.dll")] public static extern int FillRect(IntPtr hdc, ref RECT rect, IntPtr brush);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int DrawTextW(IntPtr hdc, string text, int count, ref RECT rect, uint format);
    [DllImport("user32.dll")] public static extern IntPtr BeginPaint(IntPtr hwnd, out PAINTSTRUCT lpPaint);
    [DllImport("user32.dll")] public static extern bool EndPaint(IntPtr hwnd, ref PAINTSTRUCT lpPaint);
    [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int pvAttribute, int cbAttribute);
    [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int nWidth, int nHeight, bool bRepaint);
    [DllImport("user32.dll")] public static extern bool PostMessageW(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool OpenClipboard(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool EmptyClipboard();
    [DllImport("user32.dll")] public static extern IntPtr SetClipboardData(uint format, IntPtr hMem);
    [DllImport("user32.dll")] public static extern bool CloseClipboard();
    [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool GetSaveFileNameW(ref OPENFILENAMEW ofn);
    [DllImport("kernel32.dll")] public static extern IntPtr GlobalAlloc(uint flags, UIntPtr bytes);
    [DllImport("kernel32.dll")] public static extern IntPtr GlobalLock(IntPtr hMem);
    [DllImport("kernel32.dll")] public static extern bool GlobalUnlock(IntPtr hMem);
    [DllImport("kernel32.dll")] public static extern IntPtr GlobalFree(IntPtr hMem);
    [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool GetOpenFileNameW(ref OPENFILENAMEW ofn);
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = true)]
    public static extern int SHCreateItemFromParsingName(string path, IntPtr bind, ref Guid iid, [MarshalAs(UnmanagedType.Interface)] out IShellItem item);

    public static Guid ShellItemId = new("43826d1e-e718-42ee-bc55-a1e261c37bfe");

    [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")]
    public class FileOpenDialog { }

    [ComImport, Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IShellItem
    {
        void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);
        void GetParent(out IShellItem ppsi);
        void GetDisplayName(uint sigdnName, out IntPtr ppszName);
        void GetAttributes(uint mask, out uint attributes);
        void Compare(IShellItem psi, uint hint, out int order);
    }

    [ComImport, Guid("d57c7288-d4ad-4768-be02-9d969532d960"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IFileOpenDialog
    {
        [PreserveSig] int Show(IntPtr parent);
        void SetFileTypes(uint count, IntPtr types);
        void SetFileTypeIndex(uint index);
        void GetFileTypeIndex(out uint index);
        void Advise(IntPtr events, out uint cookie);
        void Unadvise(uint cookie);
        void SetOptions(uint options);
        void GetOptions(out uint options);
        void SetDefaultFolder(IShellItem folder);
        void SetFolder(IShellItem folder);
        void GetFolder(out IShellItem folder);
        void GetCurrentSelection(out IShellItem item);
        void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name);
        void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string name);
        void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
        void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string text);
        void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string label);
        void GetResult(out IShellItem item);
        void AddPlace(IShellItem item, int place);
        void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string extension);
        void Close(int hr);
        void SetClientGuid(ref Guid guid);
        void ClearClientData();
        void SetFilter(IntPtr filter);
        void GetResults(out IntPtr items);
        void GetSelectedItems(out IntPtr items);
    }
    [DllImport("ole32.dll")] public static extern void CoTaskMemFree(IntPtr pv);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct BROWSEINFOW
    {
        public IntPtr hwndOwner;
        public IntPtr pidlRoot;
        public IntPtr pszDisplayName;
        public string lpszTitle;
        public uint ulFlags;
        public IntPtr lpfn;
        public IntPtr lParam;
        public int iImage;
    }

    public delegate IntPtr WndProcDelegate(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct WNDCLASSW
    {
        public uint style;
        public WndProcDelegate lpfnWndProc;
        public int cbClsExtra;
        public int cbWndExtra;
        public IntPtr hInstance;
        public IntPtr hIcon;
        public IntPtr hCursor;
        public IntPtr hbrBackground;
        public string? lpszMenuName;
        public string lpszClassName;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public int ptX;
        public int ptY;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct OPENFILENAMEW
    {
        public int lStructSize;
        public IntPtr hwndOwner;
        public IntPtr hInstance;
        public string lpstrFilter;
        public string? lpstrCustomFilter;
        public int nMaxCustFilter;
        public int nFilterIndex;
        public IntPtr lpstrFile;
        public int nMaxFile;
        public IntPtr lpstrFileTitle;
        public int nMaxFileTitle;
        public string? lpstrInitialDir;
        public string lpstrTitle;
        public int Flags;
        public short nFileOffset;
        public short nFileExtension;
        public string? lpstrDefExt;
        public IntPtr lCustData;
        public IntPtr lpfnHook;
        public string? lpTemplateName;
        public IntPtr pvReserved;
        public int dwReserved;
        public int FlagsEx;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int left;
        public int top;
        public int right;
        public int bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PAINTSTRUCT
    {
        public IntPtr hdc;
        public int fErase;
        public RECT rcPaint;
        public int fRestore;
        public int fIncUpdate;
        public int reserved0;
        public int reserved1;
        public int reserved2;
        public int reserved3;
        public int reserved4;
        public int reserved5;
        public int reserved6;
        public int reserved7;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct DRAWITEMSTRUCT
    {
        public uint CtlType;
        public uint CtlID;
        public uint itemID;
        public uint itemAction;
        public uint itemState;
        public IntPtr hwndItem;
        public IntPtr hDC;
        public RECT rcItem;
        public IntPtr itemData;
    }
}

sealed class StaSync : SynchronizationContext
{
    readonly IntPtr _hwnd;
    public StaSync(IntPtr hwnd) => _hwnd = hwnd;
    public override void Post(SendOrPostCallback callback, object? state)
    {
        var held = GCHandle.Alloc(Tuple.Create(callback, state));
        Native.PostMessageW(_hwnd, 0x8001, GCHandle.ToIntPtr(held), IntPtr.Zero);
    }
}

sealed class SessionFile(string name, string role, string b64)
{
    public string Name { get; } = name;
    public string Role { get; } = role;
    public string B64 { get; } = b64;
}
