#include <bits/stdc++.h>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    const int INF = 1e9;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;

    for (int c : coins) {
        for (int i = c; i <= amount; i++) {
            dp[i] = min(dp[i], dp[i - c] + 1);
        }
    }
    return dp[amount] == INF ? -1 : dp[amount];
}

int main() {
    vector<int> coins = {1, 2, 5};
    int amount = 11;
    cout << "Min coins to make " << amount << " = " << coinChange(coins, amount) << endl;
    return 0;
}
