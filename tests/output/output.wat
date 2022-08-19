(module
 (type $none_=>_none (func))
 (type $none_=>_i32 (func (result i32)))
 (type $f64_i32_=>_none (func (param f64 i32)))
 (type $i32_=>_none (func (param i32)))
 (type $i32_i32_i32_i32_=>_none (func (param i32 i32 i32 i32)))
 (import "__asCovers" "cover" (func $~lib/index/__cover (param i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $tests/test/arrowFunc1 i32 (i32.const 64))
 (global $tests/test/arrowFunc2 i32 (i32.const 96))
 (global $~argumentsLength (mut i32) (i32.const 0))
 (global $tests/test/singleLineFunc1 i32 (i32.const 176))
 (global $tests/test/singleLineFunc2 i32 (i32.const 208))
 (global $~lib/memory/__data_end i32 (i32.const 268))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 16652))
 (global $~lib/memory/__heap_base i32 (i32.const 16652))
 (global $~started (mut i32) (i32.const 0))
 (memory $0 1)
 (data (i32.const 12) "\1c\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 44) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\01\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 76) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\02\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 108) ",\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\18\00\00\00H\00e\00l\00l\00o\00 \00W\00o\00r\00l\00d\00!\00\00\00\00\00")
 (data (i32.const 156) "\1c\00\00\00\00\00\00\00\00\00\00\00\04\00\00\00\08\00\00\00\03\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 188) "\1c\00\00\00\00\00\00\00\00\00\00\00\04\00\00\00\08\00\00\00\04\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 220) ",\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\18\00\00\00H\00e\00l\00l\00o\00,\00 \00w\00o\00r\00l\00d\00\00\00\00\00")
 (table $0 5 5 funcref)
 (elem $0 (i32.const 1) $start:tests/test~anonymous|0 $start:tests/test~anonymous|1 $start:tests/test~anonymous|2 $start:tests/test~anonymous|3)
 (export "memory" (memory $0))
 (export "_start" (func $~start))
 (func $start:tests/test~anonymous|0
  i32.const -226323534
  call $~lib/index/__cover
  i32.const -1384128236
  call $~lib/index/__cover
 )
 (func $start:tests/test~anonymous|1
  i32.const -1661511543
  call $~lib/index/__cover
  i32.const 2097816477
  call $~lib/index/__cover
 )
 (func $tests/test/normalFunc1
  i32.const 1752755751
  call $~lib/index/__cover
  i32.const 824394804
  call $~lib/index/__cover
 )
 (func $start:tests/test~anonymous|2 (result i32)
  i32.const 128
 )
 (func $start:tests/test~anonymous|3 (result i32)
  i32.const 32
 )
 (func $tests/test/defaultPropFunc1 (param $0 f64) (param $1 i32)
  i32.const 398790090
  call $~lib/index/__cover
  i32.const 1859609853
  call $~lib/index/__cover
 )
 (func $tests/test/defaultPropFunc2 (param $0 f64) (param $1 i32)
  i32.const 768135699
  call $~lib/index/__cover
  i32.const 1046587270
  call $~lib/index/__cover
 )
 (func $~start
  global.get $~started
  if
   return
  end
  i32.const 1
  global.set $~started
  call $start:tests/test
 )
 (func $~stack_check
  global.get $~lib/memory/__stack_pointer
  global.get $~lib/memory/__data_end
  i32.lt_s
  if
   i32.const 16672
   i32.const 16720
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $start:tests/test
  (local $0 i32)
  (local $1 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  i32.const -1656929021
  call $~lib/index/__cover
  i32.const 1
  drop
  i32.const 680652760
  call $~lib/index/__cover
  i32.const 0
  drop
  i32.const 1
  drop
  i32.const -1813501367
  call $~lib/index/__cover
  i32.const 32
  drop
  i32.const 0
  drop
  i32.const 0
  global.set $~argumentsLength
  global.get $tests/test/arrowFunc1
  i32.load
  call_indirect $0 (type $none_=>_none)
  call $tests/test/normalFunc1
  i32.const 0
  global.set $~argumentsLength
  global.get $tests/test/singleLineFunc1
  i32.load
  call_indirect $0 (type $none_=>_i32)
  drop
  i32.const 188417635
  call $~lib/index/__cover
  i32.const 1
  drop
  i32.const 54404129
  call $~lib/index/__cover
  i32.const 0
  drop
  i32.const 1
  drop
  i32.const -1588026583
  call $~lib/index/__cover
  i32.const 0
  drop
  block $case2|0
   block $case1|0
    block $case0|0
     i32.const 1
     local.set $0
     local.get $0
     i32.const 1
     i32.eq
     br_if $case0|0
     local.get $0
     i32.const 0
     i32.eq
     br_if $case1|0
     br $case2|0
    end
    i32.const 1629206142
    call $~lib/index/__cover
    i32.const 32
    drop
   end
   i32.const -2130099907
   call $~lib/index/__cover
   i32.const 32
   drop
  end
  i32.const -1589812793
  call $~lib/index/__cover
  i32.const 32
  drop
  f64.const 3.14
  i32.const 240
  local.set $1
  global.get $~lib/memory/__stack_pointer
  local.get $1
  i32.store
  local.get $1
  call $tests/test/defaultPropFunc1
  f64.const 3.14
  i32.const 0
  call $tests/test/defaultPropFunc2
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
)
