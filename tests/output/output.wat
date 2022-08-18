(module
 (type $none_=>_none (func))
 (type $f64_i32_=>_none (func (param f64 i32)))
 (type $none_=>_i32 (func (result i32)))
 (type $i32_i32_i32_i32_i32_=>_none (func (param i32 i32 i32 i32 i32)))
 (type $i32_=>_none (func (param i32)))
 (type $i32_i32_i32_i32_=>_none (func (param i32 i32 i32 i32)))
 (import "__asCovers" "coverDeclare" (func $~lib/index/__coverDeclare (param i32 i32 i32 i32 i32)))
 (import "__asCovers" "cover" (func $~lib/index/__cover (param i32)))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~argumentsLength (mut i32) (i32.const 0))
 (global $~lib/memory/__data_end i32 (i32.const 444))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 16828))
 (global $~lib/memory/__heap_base i32 (i32.const 16828))
 (memory $0 1)
 (data (i32.const 12) ",\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\1a\00\00\00t\00e\00s\00t\00s\00/\00t\00e\00s\00t\00.\00t\00s\00\00\00")
 (data (i32.const 60) "\1c\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 92) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\01\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 124) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\02\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 156) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\03\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 188) "\1c\00\00\00\00\00\00\00\00\00\00\00\03\00\00\00\08\00\00\00\04\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 220) ",\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\18\00\00\00H\00e\00l\00l\00o\00 \00W\00o\00r\00l\00d\00!\00\00\00\00\00")
 (data (i32.const 268) "\1c\00\00\00\00\00\00\00\00\00\00\00\04\00\00\00\08\00\00\00\05\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 300) "\1c\00\00\00\00\00\00\00\00\00\00\00\04\00\00\00\08\00\00\00\06\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 332) "\1c\00\00\00\00\00\00\00\00\00\00\00\05\00\00\00\08\00\00\00\07\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 364) "\1c\00\00\00\00\00\00\00\00\00\00\00\05\00\00\00\08\00\00\00\08\00\00\00\00\00\00\00\00\00\00\00")
 (data (i32.const 396) ",\00\00\00\00\00\00\00\00\00\00\00\01\00\00\00\18\00\00\00H\00e\00l\00l\00o\00,\00 \00w\00o\00r\00l\00d\00\00\00\00\00")
 (table $0 9 9 funcref)
 (elem $0 (i32.const 1) $tests/test/run_tests~anonymous|0 $tests/test/run_tests~anonymous|1 $tests/test/run_tests~normalFunc1 $tests/test/run_tests~normalFunc2 $tests/test/run_tests~anonymous|2 $tests/test/run_tests~anonymous|3 $tests/test/run_tests~defaultPropFunc1@varargs $tests/test/run_tests~defaultPropFunc2@varargs)
 (export "run_tests" (func $tests/test/run_tests))
 (export "memory" (memory $0))
 (start $~start)
 (func $tests/test/run_tests~anonymous|0
  i32.const -1861620434
  call $~lib/index/__cover
  i32.const -265856744
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~anonymous|1
  i32.const 998158853
  call $~lib/index/__cover
  i32.const -1078879327
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~normalFunc1
  i32.const 117458851
  call $~lib/index/__cover
  i32.const 1942666296
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~normalFunc2
  i32.const 336313569
  call $~lib/index/__cover
  i32.const 1125017846
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~anonymous|2 (result i32)
  i32.const 240
 )
 (func $tests/test/run_tests~anonymous|3 (result i32)
  i32.const 80
 )
 (func $tests/test/run_tests~defaultPropFunc1 (param $0 f64) (param $1 i32)
  i32.const -1236506810
  call $~lib/index/__cover
  i32.const 1332613910
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~defaultPropFunc2 (param $0 f64) (param $1 i32)
  i32.const -867161201
  call $~lib/index/__cover
  i32.const 519591327
  call $~lib/index/__cover
 )
 (func $tests/test/run_tests~defaultPropFunc1@varargs (param $0 f64) (param $1 i32)
  block $1of1
   block $0of1
    block $outOfRange
     global.get $~argumentsLength
     i32.const 1
     i32.sub
     br_table $0of1 $1of1 $outOfRange
    end
    unreachable
   end
   i32.const 0
   local.set $1
  end
  local.get $0
  local.get $1
  call $tests/test/run_tests~defaultPropFunc1
 )
 (func $tests/test/run_tests~defaultPropFunc2@varargs (param $0 f64) (param $1 i32)
  block $1of1
   block $0of1
    block $outOfRange
     global.get $~argumentsLength
     i32.const 1
     i32.sub
     br_table $0of1 $1of1 $outOfRange
    end
    unreachable
   end
   i32.const 0
   local.set $1
  end
  local.get $0
  local.get $1
  call $tests/test/run_tests~defaultPropFunc2
 )
 (func $~start
  call $start:tests/test
 )
 (func $~stack_check
  global.get $~lib/memory/__stack_pointer
  global.get $~lib/memory/__data_end
  i32.lt_s
  if
   i32.const 16848
   i32.const 16896
   i32.const 1
   i32.const 1
   call $~lib/builtins/abort
   unreachable
  end
 )
 (func $start:tests/test
  (local $0 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.store
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1633044042
  i32.const 17
  i32.const 35
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -538657529
  i32.const 19
  i32.const 5
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1798924252
  i32.const 24
  i32.const 15
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1960381797
  i32.const 26
  i32.const 16
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1375791931
  i32.const 31
  i32.const 15
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1021667686
  i32.const 33
  i32.const 16
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -265856744
  i32.const 38
  i32.const 36
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1861620434
  i32.const 38
  i32.const 24
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1078879327
  i32.const 40
  i32.const 36
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 998158853
  i32.const 40
  i32.const 24
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1942666296
  i32.const 47
  i32.const 34
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 117458851
  i32.const 47
  i32.const 5
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1125017846
  i32.const 49
  i32.const 34
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 336313569
  i32.const 49
  i32.const 5
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 2060650565
  i32.const 56
  i32.const 29
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 255212231
  i32.const 58
  i32.const 29
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1220490008
  i32.const 65
  i32.const 13
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1079941398
  i32.const 67
  i32.const 13
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 747190532
  i32.const 72
  i32.const 13
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1150317147
  i32.const 74
  i32.const 14
  i32.const 2
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1547489662
  i32.const 77
  i32.const 19
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1637871446
  i32.const 79
  i32.const 20
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -2116808736
  i32.const 81
  i32.const 21
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 1332613910
  i32.const 88
  i32.const 73
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1236506810
  i32.const 88
  i32.const 5
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const 519591327
  i32.const 90
  i32.const 73
  i32.const 1
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -867161201
  i32.const 90
  i32.const 5
  i32.const 0
  call $~lib/index/__coverDeclare
  i32.const 32
  local.set $0
  global.get $~lib/memory/__stack_pointer
  local.get $0
  i32.store
  local.get $0
  i32.const -1981537692
  i32.const 17
  i32.const 1
  i32.const 0
  call $~lib/index/__coverDeclare
  global.get $~lib/memory/__stack_pointer
  i32.const 4
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
 (func $tests/test/run_tests
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  global.get $~lib/memory/__stack_pointer
  i32.const 20
  i32.sub
  global.set $~lib/memory/__stack_pointer
  call $~stack_check
  global.get $~lib/memory/__stack_pointer
  i32.const 0
  i32.const 20
  memory.fill
  i32.const -1981537692
  call $~lib/index/__cover
  i32.const -1633044042
  call $~lib/index/__cover
  i32.const -538657529
  call $~lib/index/__cover
  i32.const 1
  drop
  i32.const 1798924252
  call $~lib/index/__cover
  i32.const 0
  drop
  i32.const 1
  drop
  i32.const -1375791931
  call $~lib/index/__cover
  i32.const 80
  drop
  i32.const 0
  drop
  i32.const 0
  global.set $~argumentsLength
  i32.const 112
  i32.load
  call_indirect $0 (type $none_=>_none)
  global.get $~lib/memory/__stack_pointer
  i32.const 176
  local.tee $0
  i32.store
  local.get $0
  drop
  global.get $~lib/memory/__stack_pointer
  i32.const 208
  local.tee $1
  i32.store offset=4
  local.get $1
  drop
  i32.const 0
  global.set $~argumentsLength
  local.get $0
  i32.load
  call_indirect $0 (type $none_=>_none)
  i32.const 0
  global.set $~argumentsLength
  i32.const 288
  i32.load
  call_indirect $0 (type $none_=>_i32)
  drop
  i32.const -1220490008
  call $~lib/index/__cover
  i32.const 1
  drop
  i32.const -1079941398
  call $~lib/index/__cover
  i32.const 0
  drop
  i32.const 1
  drop
  i32.const -1150317147
  call $~lib/index/__cover
  i32.const 0
  drop
  block $case2|0
   block $case1|0
    block $case0|0
     i32.const 1
     local.set $2
     local.get $2
     i32.const 1
     i32.eq
     br_if $case0|0
     local.get $2
     i32.const 0
     i32.eq
     br_if $case1|0
     br $case2|0
    end
    i32.const -1547489662
    call $~lib/index/__cover
    i32.const 80
    drop
   end
   i32.const 1637871446
   call $~lib/index/__cover
   i32.const 80
   drop
  end
  i32.const -2116808736
  call $~lib/index/__cover
  i32.const 80
  drop
  global.get $~lib/memory/__stack_pointer
  i32.const 352
  local.tee $2
  i32.store offset=8
  local.get $2
  drop
  global.get $~lib/memory/__stack_pointer
  i32.const 384
  local.tee $3
  i32.store offset=12
  local.get $3
  drop
  f64.const 3.14
  i32.const 416
  local.set $4
  global.get $~lib/memory/__stack_pointer
  local.get $4
  i32.store offset=16
  local.get $4
  i32.const 2
  global.set $~argumentsLength
  local.get $2
  i32.load
  call_indirect $0 (type $f64_i32_=>_none)
  f64.const 3.14
  i32.const 0
  i32.const 1
  global.set $~argumentsLength
  local.get $3
  i32.load
  call_indirect $0 (type $f64_i32_=>_none)
  global.get $~lib/memory/__stack_pointer
  i32.const 20
  i32.add
  global.set $~lib/memory/__stack_pointer
 )
)
