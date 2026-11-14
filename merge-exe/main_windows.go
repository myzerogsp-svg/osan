//go:build windows

package main

import (
	"fmt"
	"syscall"
	"unsafe"

	"github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
)

func main() {
	if err := run(); err != nil {
		alert("엑셀을 만들지 못했습니다.\n"+err.Error(), "센터 파일 합치기")
	}
}

func run() error {
	picked := make([]struct{ center, path string }, 0, 3)
	for _, center := range []string{"1센터", "2센터", "3센터"} {
		path, ok, err := openDialog(center + " 파일을 고르세요. 없으면 취소를 누르세요.")
		if err != nil {
			return err
		}
		if ok {
			picked = append(picked, struct{ center, path string }{center, path})
		}
	}
	if len(picked) == 0 {
		return nil
	}
	outPath, ok, err := saveDialog()
	if err != nil || !ok {
		return err
	}

	if err = ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED); err != nil {
		return err
	}
	defer ole.CoUninitialize()

	unknown, err := oleutil.CreateObject("Excel.Application")
	if err != nil {
		return fmt.Errorf("이 컴퓨터에서 엑셀을 실행하지 못했습니다.\n엑셀이 설치되어 있는지 확인해 주세요")
	}
	defer unknown.Release()
	excel, err := unknown.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		return err
	}
	defer func() {
		_, _ = oleutil.CallMethod(excel, "Quit")
		excel.Release()
	}()
	_, _ = oleutil.PutProperty(excel, "Visible", 0)
	_, _ = oleutil.PutProperty(excel, "DisplayAlerts", 0)
	_, _ = oleutil.PutProperty(excel, "AskToUpdateLinks", 0)
	_, _ = oleutil.PutProperty(excel, "EnableEvents", 0)

	workbooks, err := dispatchProp(excel, "Workbooks")
	if err != nil {
		return err
	}
	defer workbooks.Release()
	outBook, err := dispatchCall(workbooks, "Add")
	if err != nil {
		return err
	}
	defer outBook.Release()

	for _, item := range picked {
		if err = copyDetail(excel, workbooks, outBook, item.path, item.center); err != nil {
			return err
		}
	}
	if err = deleteExtraSheets(outBook); err != nil {
		return err
	}
	if _, err = oleutil.CallMethod(outBook, "SaveAs", outPath, 51); err != nil {
		return err
	}
	_, _ = oleutil.CallMethod(outBook, "Close", 0)
	alert("만들었습니다.\n"+outPath, "센터 파일 합치기")
	return nil
}

func copyDetail(excel, workbooks, outBook *ole.IDispatch, path, center string) error {
	src, err := dispatchCall(workbooks, "Open", path, 0, 1)
	if err != nil {
		return fmt.Errorf("%s 파일을 열지 못했습니다", center)
	}
	defer func() {
		_, _ = oleutil.CallMethod(src, "Close", 0)
		src.Release()
	}()
	detail, names, err := findDetail(src)
	if err != nil {
		return err
	}
	if detail == nil {
		return fmt.Errorf("%s 파일에 OrderDetail 시트가 없습니다.\n있는 시트: %s", center, names)
	}
	defer detail.Release()
	if _, err = oleutil.CallMethod(detail, "Copy"); err != nil {
		return err
	}
	active, err := dispatchProp(excel, "ActiveWorkbook")
	if err != nil {
		return err
	}
	defer active.Release()
	copied, err := firstSheet(active)
	if err != nil {
		return err
	}
	defer copied.Release()
	if _, err = oleutil.PutProperty(copied, "Name", center); err != nil {
		return err
	}
	anchor, err := extraSheet(outBook)
	if err != nil {
		return err
	}
	defer anchor.Release()
	_, err = oleutil.CallMethod(copied, "Move", anchor)
	return err
}

func findDetail(book *ole.IDispatch) (*ole.IDispatch, string, error) {
	sheets, err := dispatchProp(book, "Worksheets")
	if err != nil {
		return nil, "", err
	}
	defer sheets.Release()
	count, err := countOf(sheets)
	if err != nil {
		return nil, "", err
	}
	names := ""
	for i := 1; i <= count; i++ {
		sheet, err := sheetItem(sheets, i)
		if err != nil {
			return nil, "", err
		}
		name, err := propString(sheet, "Name")
		if err != nil {
			sheet.Release()
			return nil, "", err
		}
		if names != "" {
			names += ", "
		}
		names += name
		if isDetailSheet(name) {
			return sheet, names, nil
		}
		sheet.Release()
	}
	return nil, names, nil
}

func firstSheet(book *ole.IDispatch) (*ole.IDispatch, error) {
	sheets, err := dispatchProp(book, "Worksheets")
	if err != nil {
		return nil, err
	}
	defer sheets.Release()
	return sheetItem(sheets, 1)
}

func extraSheet(book *ole.IDispatch) (*ole.IDispatch, error) {
	sheets, err := dispatchProp(book, "Worksheets")
	if err != nil {
		return nil, err
	}
	defer sheets.Release()
	count, err := countOf(sheets)
	if err != nil {
		return nil, err
	}
	for i := 1; i <= count; i++ {
		sheet, err := sheetItem(sheets, i)
		if err != nil {
			return nil, err
		}
		name, err := propString(sheet, "Name")
		if err != nil {
			sheet.Release()
			return nil, err
		}
		if !isCenterSheet(name) {
			return sheet, nil
		}
		sheet.Release()
	}
	return nil, fmt.Errorf("붙여 넣을 시트를 찾지 못했습니다")
}

func deleteExtraSheets(book *ole.IDispatch) error {
	for {
		sheets, err := dispatchProp(book, "Worksheets")
		if err != nil {
			return err
		}
		count, err := countOf(sheets)
		if err != nil {
			sheets.Release()
			return err
		}
		removed := false
		for i := 1; i <= count; i++ {
			sheet, err := sheetItem(sheets, i)
			if err != nil {
				sheets.Release()
				return err
			}
			name, err := propString(sheet, "Name")
			if err != nil {
				sheet.Release()
				sheets.Release()
				return err
			}
			if !isCenterSheet(name) && count > 1 {
				_, err = oleutil.CallMethod(sheet, "Delete")
				sheet.Release()
				sheets.Release()
				if err != nil {
					return err
				}
				removed = true
				break
			}
			sheet.Release()
		}
		if !removed {
			sheets.Release()
			return nil
		}
	}
}

func dispatchProp(d *ole.IDispatch, name string, args ...interface{}) (*ole.IDispatch, error) {
	v, err := oleutil.GetProperty(d, name, args...)
	if err != nil {
		return nil, err
	}
	out := v.ToIDispatch()
	if out == nil {
		v.Clear()
		return nil, fmt.Errorf("%s 값을 읽지 못했습니다", name)
	}
	return out, nil
}

func dispatchCall(d *ole.IDispatch, name string, args ...interface{}) (*ole.IDispatch, error) {
	v, err := oleutil.CallMethod(d, name, args...)
	if err != nil {
		return nil, err
	}
	out := v.ToIDispatch()
	if out == nil {
		v.Clear()
		return nil, fmt.Errorf("%s 을 실행하지 못했습니다", name)
	}
	return out, nil
}

func sheetItem(sheets *ole.IDispatch, index int) (*ole.IDispatch, error) {
	return dispatchProp(sheets, "Item", index)
}

func countOf(d *ole.IDispatch) (int, error) {
	v, err := oleutil.GetProperty(d, "Count")
	if err != nil {
		return 0, err
	}
	n := int(int32(v.Val))
	v.Clear()
	return n, nil
}

func propString(d *ole.IDispatch, name string) (string, error) {
	v, err := oleutil.GetProperty(d, name)
	if err != nil {
		return "", err
	}
	text := v.ToString()
	v.Clear()
	return text, nil
}

func alert(text, title string) {
	msg, _ := syscall.UTF16PtrFromString(text)
	cap, _ := syscall.UTF16PtrFromString(title)
	proc := syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW")
	_, _, _ = proc.Call(0, uintptr(unsafe.Pointer(msg)), uintptr(unsafe.Pointer(cap)), 0)
}
