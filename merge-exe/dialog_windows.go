//go:build windows

package main

import (
	"runtime"
	"syscall"
	"unsafe"
)

type openfilename struct {
	StructSize      uint32
	Owner           uintptr
	Instance        uintptr
	Filter          *uint16
	CustomFilter    *uint16
	MaxCustomFilter uint32
	FilterIndex     uint32
	File            *uint16
	MaxFile         uint32
	FileTitle       *uint16
	MaxFileTitle    uint32
	InitialDir      *uint16
	Title           *uint16
	Flags           uint32
	FileOffset      uint16
	FileExtension   uint16
	DefExt          *uint16
	CustData        uintptr
	FnHook          uintptr
	TemplateName    *uint16
	PvReserved      uintptr
	DwReserved      uint32
	FlagsEx         uint32
}

const (
	ofnFileMustExist = 0x00001000
	ofnPathMustExist = 0x00000800
	ofnExplorer      = 0x00080000
	ofnOverwrite     = 0x00000002
	ofnNoChangeDir   = 0x00000008
)

func openDialog(title string) (string, bool, error) {
	return fileDialog(title, "Excel (*.xlsx; *.xls)\x00*.xlsx;*.xls;*.xlsm\x00", "", ofnFileMustExist|ofnPathMustExist|ofnExplorer|ofnNoChangeDir, false)
}

func saveDialog() (string, bool, error) {
	path, ok, err := fileDialog("업로드용 엑셀을 저장할 곳", "Excel (*.xlsx)\x00*.xlsx\x00", "xlsx", ofnPathMustExist|ofnExplorer|ofnOverwrite|ofnNoChangeDir, true)
	if err != nil || !ok {
		return "", ok, err
	}
	if len(path) < 5 || path[len(path)-5:] != ".xlsx" {
		path += ".xlsx"
	}
	return path, true, nil
}

func fileDialog(title, filter, defExt string, flags uint32, save bool) (string, bool, error) {
	buf := make([]uint16, 32768)
	titlePtr, err := syscall.UTF16PtrFromString(title)
	if err != nil {
		return "", false, err
	}
	filterBuf, err := utf16Multi(filter)
	if err != nil {
		return "", false, err
	}
	var extPtr *uint16
	if defExt != "" {
		extPtr, err = syscall.UTF16PtrFromString(defExt)
		if err != nil {
			return "", false, err
		}
	}
	ofn := openfilename{
		Filter:  &filterBuf[0],
		File:    &buf[0],
		MaxFile: uint32(len(buf)),
		Title:   titlePtr,
		Flags:   flags,
		DefExt:  extPtr,
	}
	ofn.StructSize = uint32(unsafe.Sizeof(ofn))
	procName := "GetOpenFileNameW"
	if save {
		procName = "GetSaveFileNameW"
	}
	r, _, _ := syscall.NewLazyDLL("comdlg32.dll").NewProc(procName).Call(uintptr(unsafe.Pointer(&ofn)))
	runtime.KeepAlive(buf)
	runtime.KeepAlive(filterBuf)
	runtime.KeepAlive(titlePtr)
	runtime.KeepAlive(extPtr)
	if r == 0 {
		return "", false, nil
	}
	return syscall.UTF16ToString(buf), true, nil
}

func utf16Multi(filter string) ([]uint16, error) {
	raw := make([]uint16, 0, 64)
	for i := 0; i < len(filter); {
		if filter[i] == 0 {
			raw = append(raw, 0)
			i++
			continue
		}
		j := i
		for j < len(filter) && filter[j] != 0 {
			j++
		}
		part, err := syscall.UTF16FromString(filter[i:j])
		if err != nil {
			return nil, err
		}
		if len(part) > 0 {
			part = part[:len(part)-1]
		}
		raw = append(raw, part...)
		raw = append(raw, 0)
		i = j
	}
	raw = append(raw, 0)
	return raw, nil
}
