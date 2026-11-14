package main

import "strings"

func isDetailSheet(name string) bool {
	key := strings.ToLower(strings.ReplaceAll(name, " ", ""))
	return key == "torderdetail" || key == "orderdetail" || strings.Contains(key, "orderdetail")
}

func isCenterSheet(name string) bool {
	return name == "1센터" || name == "2센터" || name == "3센터"
}
