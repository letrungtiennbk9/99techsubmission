var sum_to_n_a = function(n) {
    let result = 0;
    for (let i = 0; i <= n; i++) {
        result += i
    }
    return result;
};

var sum_to_n_b = function(n) {
    if (n === 0) {
        return 0;
    } else {
        return n + sum_to_n_b(n - 1);
    }
};

var sum_to_n_c = function(n) {
    return n * (n + 1) / 2;
};

console.log(sum_to_n_a(6));
console.log(sum_to_n_b(6));
console.log(sum_to_n_c(6));