<template>
  <div class="home-content">
    <header class="hero">
      <p class="eyebrow">欢迎回来</p>
      <h1>控制中心</h1>
    </header>

    <div class="nav-grid">
      <!-- 这里的 navItems 可以根据权限在 Home 内部维护，或者使用全局 Store -->
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-card"
      >
        <h2>{{ item.title }}</h2>
        <p>{{ item.desc }}</p>
        <span class="cta">{{ item.action }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.hero {
  margin-bottom: 2rem;
  animation: fadeUp 0.5s ease-out;
}
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
/* nav-card 样式可以使用之前 style.css 里的定义 */
</style>