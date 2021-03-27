<script>
  import FormSelect from '../FormSelect.svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let langList = [
    {
      name: '中文',
      value: 'zh'
    },
    {
      name: '英语',
      value: 'en'
    },
    {
      name: '日语',
      value: 'ja'
    }
  ]
  export let value = ['en', 'zh']

  let leftShowList = false
  let rightShowList = false
  function handleLeftClick() {
    rightShowList = false
  }
  function handleRightClick() {
    leftShowList = false
  }
  function handleChangeLeft({ detail }) {
    if (value[1] === detail.value) {
      value[1] = value[0]
    }
    value[0] = detail.value
    dispatch('handleChange', value)
  }
  function handleChangeRight({ detail }) {
    if (value[0] === detail.value) {
      value[0] = value[1]
    }
    value[1] = detail.value
    dispatch('handleChange', value)
  }

  function handleSwitch() {
    const temp = value[0]
    value[0] = value[1]
    value[1] = temp
    dispatch('handleChange', value)
  }
  function handleClick() {
    leftShowList = false
    rightShowList = false
  }
</script>

<main class="flex-between cursor-pointer" on:click={handleClick}>
  <FormSelect
    on:handleClick={handleLeftClick}
    on:handleChange={handleChangeLeft}
    options={langList}
    value={value[0]}
    bind:showList={leftShowList}
  />
  <i
    class="trans-lang-middle iconfont icon-arrow-compare flex-center hover-color-main color-66"
    on:click={handleSwitch}
  />
  <FormSelect
    on:handleClick={handleRightClick}
    on:handleChange={handleChangeRight}
    options={langList}
    value={value[1]}
    bind:showList={rightShowList}
  />
</main>

<style lang="scss" scoped>
  main {
    height: 26px;
    width: 248px;
  }
</style>
