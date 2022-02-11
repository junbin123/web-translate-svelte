<script>
  import FormSelect from './FormSelect.svelte'
  import iconRight from '../static/images/icon-right.png'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let langList = [
    {
      name: '中文',
      value: 'zh',
    },
    {
      name: '英语',
      value: 'en',
    },
    {
      name: '日语',
      value: 'jp',
    },
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

  function handleClick() {
    leftShowList = false
    rightShowList = false
  }
</script>

<main class="container flex-between" on:click={handleClick}>
  <FormSelect
    on:handleClick={handleLeftClick}
    on:handleChange={handleChangeLeft}
    options={langList}
    value={value[0]}
    bind:showList={leftShowList}
  />
  <img src={iconRight} alt="icon" class="middle-icon" />
  <FormSelect
    on:handleClick={handleRightClick}
    on:handleChange={handleChangeRight}
    options={langList}
    value={value[1]}
    bind:showList={rightShowList}
  />
</main>

<style scoped>
  .container {
    width: 200px;
    height: 30px;
  }
  .middle-icon {
    width: 20px;
    height: 20px;
  }
</style>
