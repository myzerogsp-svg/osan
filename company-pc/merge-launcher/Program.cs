using System.Runtime.InteropServices;
using System.Text;
using ClosedXML.Excel;
using ExcelDataReader;

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
    const int OFN_FILEMUSTEXIST = 0x00001000;
    const int OFN_PATHMUSTEXIST = 0x00000800;
    const int OFN_EXPLORER = 0x00080000;
    const int OFN_OVERWRITEPROMPT = 0x00000002;

    static readonly string[] Titles = ["1센터", "2센터", "3센터"];
    static readonly string[] Paths = ["", "", ""];
    static readonly IntPtr[] NameLabels = new IntPtr[3];
    static readonly Native.WndProcDelegate Proc = WndProc;
    static IntPtr _window;
    static IntPtr _status;

    [STAThread]
    static int Main()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var instance = Native.GetModuleHandleW(null);
        var cls = new Native.WNDCLASSW
        {
            lpfnWndProc = Proc,
            hInstance = instance,
            lpszClassName = "CenterMerge",
            hbrBackground = (IntPtr)6,
            hCursor = Native.LoadCursorW(IntPtr.Zero, (IntPtr)32512),
        };
        Native.RegisterClassW(ref cls);
        _window = Native.CreateWindowExW(0, "CenterMerge", "센터 파일 합치기",
            WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_VISIBLE,
            140, 90, 700, 390, IntPtr.Zero, IntPtr.Zero, instance, IntPtr.Zero);
        var font = Native.CreateFontW(22, 0, 0, 0, 700, 0, 0, 0, 1, 0, 0, 0, 0, "Malgun Gothic");
        var hint = Native.CreateWindowExW(0, "Static", "폴더가 달라도 센터마다 찾기를 누르세요. OrderDetail 시트를 한 엑셀로 합칩니다.",
            WS_CHILD | WS_VISIBLE, 20, 16, 650, 32, _window, IntPtr.Zero, instance, IntPtr.Zero);
        Native.SendMessageW(hint, WM_SETFONT, font, (IntPtr)1);
        for (var i = 0; i < 3; i++)
        {
            var y = 64 + i * 64;
            var label = Native.CreateWindowExW(0, "Static", $"{i + 1}. {Titles[i]}", WS_CHILD | WS_VISIBLE,
                20, y, 160, 32, _window, IntPtr.Zero, instance, IntPtr.Zero);
            var button = Native.CreateWindowExW(0, "Button", "찾기", WS_CHILD | WS_VISIBLE | WS_TABSTOP,
                190, y - 4, 100, 38, _window, (IntPtr)(1001 + i), instance, IntPtr.Zero);
            NameLabels[i] = Native.CreateWindowExW(0, "Static", "아직 없음", WS_CHILD | WS_VISIBLE,
                306, y, 360, 32, _window, IntPtr.Zero, instance, IntPtr.Zero);
            Native.SendMessageW(label, WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(button, WM_SETFONT, font, (IntPtr)1);
            Native.SendMessageW(NameLabels[i], WM_SETFONT, font, (IntPtr)1);
        }
        var make = Native.CreateWindowExW(0, "Button", "업로드용 엑셀 만들기", WS_CHILD | WS_VISIBLE | WS_TABSTOP,
            190, 262, 240, 44, _window, (IntPtr)1005, instance, IntPtr.Zero);
        Native.SendMessageW(make, WM_SETFONT, font, (IntPtr)1);
        _status = Native.CreateWindowExW(0, "Static", "없는 센터는 비워 두면 그 시트는 만들지 않습니다.",
            WS_CHILD | WS_VISIBLE, 20, 318, 650, 28, _window, IntPtr.Zero, instance, IntPtr.Zero);
        Native.SendMessageW(_status, WM_SETFONT, font, (IntPtr)1);
        Native.ShowWindow(_window, 5);
        Native.UpdateWindow(_window);
        while (Native.GetMessageW(out var msg, IntPtr.Zero, 0, 0) > 0)
        {
            Native.TranslateMessage(ref msg);
            Native.DispatchMessageW(ref msg);
        }
        return 0;
    }

    static IntPtr WndProc(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam)
    {
        if (message == WM_COMMAND)
        {
            var id = wParam.ToInt32() & 0xFFFF;
            if (id is >= 1001 and <= 1003)
            {
                var index = id - 1001;
                var picked = PickFile(hwnd, $"{Titles[index]} 파일을 고르세요");
                if (picked.Length > 0)
                {
                    Paths[index] = picked;
                    Native.SetWindowTextW(NameLabels[index], Path.GetFileName(picked));
                    Native.SetWindowTextW(_status, $"{Titles[index]} 선택됨");
                }
                return IntPtr.Zero;
            }
            if (id == 1005)
            {
                Make();
                return IntPtr.Zero;
            }
        }
        if (message == WM_CLOSE)
        {
            Native.DestroyWindow(hwnd);
            return IntPtr.Zero;
        }
        if (message == WM_DESTROY)
        {
            Native.PostQuitMessage(0);
            return IntPtr.Zero;
        }
        return Native.DefWindowProcW(hwnd, message, wParam, lParam);
    }

    static void Make()
    {
        if (Paths.All(string.IsNullOrEmpty))
        {
            Native.MessageBoxW(_window, "센터 파일을 하나 이상 고르세요.", "센터 파일 합치기", 0);
            return;
        }
        var save = SavePath(_window);
        if (save.Length == 0) return;
        try
        {
            Native.SetWindowTextW(_status, "엑셀 만드는 중");
            Native.UpdateWindow(_window);
            using var book = new XLWorkbook();
            var notes = new List<string>();
            for (var i = 0; i < 3; i++)
            {
                if (Paths[i].Length == 0) continue;
                Native.SetWindowTextW(_status, $"{Titles[i]} 읽는 중");
                Native.UpdateWindow(_window);
                var rows = ReadDetail(Paths[i]);
                var sheet = book.Worksheets.Add(Titles[i]);
                for (var r = 0; r < rows.Count; r++)
                {
                    var row = rows[r];
                    for (var c = 0; c < row.Count; c++)
                    {
                        if (row[c] == null) continue;
                        sheet.Cell(r + 1, c + 1).Value = CellValue(row[c]!);
                    }
                }
                notes.Add($"{Titles[i]} {rows.Count - 1:N0}행");
            }
            book.SaveAs(save);
            Native.SetWindowTextW(_status, "저장했습니다. " + Path.GetFileName(save));
            Native.MessageBoxW(_window, "만들었습니다.\n" + string.Join("\n", notes) + "\n\n" + save, "센터 파일 합치기", 0);
        }
        catch (Exception err)
        {
            Native.SetWindowTextW(_status, "실패");
            Native.MessageBoxW(_window, err.Message, "센터 파일 합치기", 0);
        }
    }

    static List<List<object?>> ReadDetail(string path)
    {
        using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var reader = ExcelReaderFactory.CreateReader(stream);
        var names = new List<string>();
        do
        {
            names.Add(reader.Name);
            if (!IsDetail(reader.Name)) continue;
            var rows = new List<List<object?>>();
            while (reader.Read())
            {
                var row = new List<object?>(reader.FieldCount);
                for (var c = 0; c < reader.FieldCount; c++)
                {
                    var value = reader.GetValue(c);
                    row.Add(value == null || value is DBNull ? null : value);
                }
                rows.Add(row);
            }
            if (rows.Count < 2) throw new Exception($"{Path.GetFileName(path)} 의 OrderDetail에 데이터 행이 없습니다.");
            return rows;
        }
        while (reader.NextResult());
        throw new Exception($"{Path.GetFileName(path)} 에서 OrderDetail 시트를 찾지 못했습니다.\n있는 시트: {string.Join(", ", names)}");
    }

    static bool IsDetail(string name)
    {
        var key = name.Trim().ToLowerInvariant().Replace(" ", "");
        return key is "torderdetail" or "orderdetail" || key.Contains("orderdetail");
    }

    static XLCellValue CellValue(object value)
    {
        return value switch
        {
            double number => number,
            float number => number,
            int number => number,
            long number => number,
            decimal number => (double)number,
            bool flag => flag,
            DateTime stamp => stamp,
            _ => Convert.ToString(value) ?? "",
        };
    }

    static void MakeReadable(string path)
{
    var temp = path + ".fixing";
    using (var input = System.IO.Compression.ZipFile.OpenRead(path))
    using (var output = System.IO.Compression.ZipFile.Open(temp, System.IO.Compression.ZipArchiveMode.Create))
    {
        foreach (var entry in input.Entries)
        {
            var created = output.CreateEntry(entry.FullName, System.IO.Compression.CompressionLevel.Optimal);
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

static string PickFile(IntPtr owner, string title)
    {
        return FileDialog(owner, title, save: false);
    }

    static string SavePath(IntPtr owner)
    {
        return FileDialog(owner, "업로드용 엑셀을 저장할 곳을 고르세요", save: true);
    }

    static string FileDialog(IntPtr owner, string title, bool save)
    {
        var buffer = Marshal.AllocHGlobal(520 * 2);
        try
        {
            for (var i = 0; i < 520 * 2; i++) Marshal.WriteByte(buffer, i, 0);
            if (save)
            {
                var preset = "업로드용.xlsx";
                var bytes = Encoding.Unicode.GetBytes(preset);
                Marshal.Copy(bytes, 0, buffer, bytes.Length);
            }
            var ofn = new Native.OPENFILENAMEW
            {
                hwndOwner = owner,
                lpstrFilter = save ? "Excel (*.xlsx)\0*.xlsx\0\0" : "Excel\0*.xlsx;*.xlsm;*.xls\0\0",
                lpstrFile = buffer,
                nMaxFile = 520,
                lpstrTitle = title,
                lpstrDefExt = save ? "xlsx" : null,
                Flags = OFN_EXPLORER | OFN_PATHMUSTEXIST | (save ? OFN_OVERWRITEPROMPT : OFN_FILEMUSTEXIST),
            };
            ofn.lStructSize = Marshal.SizeOf<Native.OPENFILENAMEW>();
            var ok = save ? Native.GetSaveFileNameW(ref ofn) : Native.GetOpenFileNameW(ref ofn);
            if (!ok) return "";
            return Marshal.PtrToStringUni(buffer) ?? "";
        }
        finally
        {
            Marshal.FreeHGlobal(buffer);
        }
    }
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
    [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool GetOpenFileNameW(ref OPENFILENAMEW ofn);
    [DllImport("comdlg32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool GetSaveFileNameW(ref OPENFILENAMEW ofn);

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
}
