package main

import "testing"

func TestIsDetailSheet(t *testing.T) {
	if !isDetailSheet("tOrderDetail") || !isDetailSheet("OrderDetail") || !isDetailSheet(" tOrderDetail ") {
		t.Fatal("expected order detail names")
	}
	if isDetailSheet("tOrderMaster") || isCenterSheet("tOrderDetail") {
		t.Fatal("unexpected match")
	}
	if !isCenterSheet("2센터") {
		t.Fatal("center")
	}
}
